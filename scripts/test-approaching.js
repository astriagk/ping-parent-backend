/**
 * Test script for the driver:approaching_waypoint event.
 *
 * Fill in the constants below with real values from your DB, then run:
 *   node scripts/test-approaching.js
 */

const { io } = require("socket.io-client");

// ─── FILL THESE IN ────────────────────────────────────────────────────────────
const SERVER_URL = "http://localhost:3000";

const DRIVER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWM2MDI0ZGVlN2IxMTRkZDlhMDE0YmQiLCJyb2xlIjoiZHJpdmVyIiwiaWF0IjoxNzc3NTY1MTU0LCJleHAiOjE3NzgxNjk5NTR9.wm28BvJlJ4SMfvQ5gAylrhr6o9mH1Vhxdgd18ADW74g"; // valid driver access token
const DRIVER_USER_ID = "69c6024dee7b114dd9a014bd"; // driver's user_id

const PARENT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWM2MTRjNmVlN2IxMTRkZDlhMDE0Y2QiLCJyb2xlIjoicGFyZW50IiwiaWF0IjoxNzc3NTY1MTk2LCJleHAiOjE3NzgxNjk5OTZ9.AB_2vWFWeeUEHmeduemvciu9qMQ43FwmafE7KksoYyw"; // valid parent access token
const PARENT_USER_ID = "69c614c6ee7b114dd9a014cd"; // parent's user_id

const TRIP_ID = "69f37e5a53b805bfceb1cbb5"; // an active trip the driver owns and parent has a student on
const STUDENT_ID = "69c6193fee7b114dd9a014d2"; // any one student's _id at the next waypoint
// ──────────────────────────────────────────────────────────────────────────────

function connect(token, userId, role) {
  return io(SERVER_URL, {
    auth: { token, userId, role },
    transports: ["websocket"],
  });
}

function waitForEvent(socket, event, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function run() {
  console.log("Connecting sockets...");

  const driver = connect(DRIVER_TOKEN, DRIVER_USER_ID, "driver");
  const parent = connect(PARENT_TOKEN, PARENT_USER_ID, "parent");

  await Promise.all([
    waitForEvent(driver, "connect"),
    waitForEvent(parent, "connect"),
  ]);
  console.log("✓ Both sockets connected");

  // Driver subscribes to trip
  await new Promise((resolve, reject) => {
    driver.emit("driver:subscribe_trip", TRIP_ID, (ok) => {
      if (ok) { console.log("✓ Driver subscribed to trip"); resolve(); }
      else reject(new Error("Driver failed to subscribe to trip"));
    });
  });

  // Parent subscribes to trip (optional for this test — approaching goes to personal room)
  await new Promise((resolve, reject) => {
    parent.emit("parent:subscribe_trip", TRIP_ID, (ok) => {
      if (ok) { console.log("✓ Parent subscribed to trip"); resolve(); }
      else reject(new Error("Parent failed to subscribe to trip"));
    });
  });

  // Listen for the approaching notification on the parent socket
  const approachingPromise = waitForEvent(parent, "parent:my_student_approaching", 6000);

  // Driver fires the approaching event
  console.log("Driver emitting driver:approaching_waypoint...");
  driver.emit("driver:approaching_waypoint", {
    tripId: TRIP_ID,
    studentId: STUDENT_ID,
    eta: 60, // 1 minute
  }, (ok) => {
    console.log("✓ Server acknowledged approaching event:", ok);
  });

  // Wait for parent to receive it
  try {
    const data = await approachingPromise;
    console.log("\n✓ Parent received parent:my_student_approaching:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("\n✗", err.message);
    console.error("  → Check that STUDENT_ID belongs to a student on this trip whose parent matches PARENT_USER_ID");
  }

  driver.disconnect();
  parent.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
