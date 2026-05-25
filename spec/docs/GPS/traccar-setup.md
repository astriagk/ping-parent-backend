# Traccar Setup — Step by Step

This doc walks through getting Traccar running and forwarding GPS positions into our backend's `POST /api/v1/gps/ingest` endpoint described in [gps-tracker-integration.md](./gps-tracker-integration.md).

---

## First: clear up the website confusion

There are **two** Traccar websites and they are easy to mix up:

| Site | What it is | What you'll see | Use it? |
|---|---|---|---|
| **<https://www.traccar.org>** | The **free, open-source** self-hosted server. Apache-2.0 licensed. | "Open Source GPS Tracking Platform", download links | ✅ **This is what we want.** |
| <https://www.traccar.com> | A paid, fully-managed cloud version of the same product. | Pricing per device, "Sign up", "Plans" | ❌ Ignore. (Could be used to skip self-hosting, but we don't need it.) |

If you're seeing pricing, you're on `.com`. Switch to `.org`.

---

## Why we need Traccar at all (in one paragraph)

GPS trackers don't speak HTTP or WebSockets. Each vendor (Concox, Teltonika, Queclink, etc.) has its own proprietary binary protocol over plain TCP. Traccar is a server that already knows **200+ of those protocols**. We point the tracker at Traccar, Traccar decodes the binary into JSON, then forwards that JSON to our backend over a normal HTTPS POST. Without Traccar we'd have to write and maintain a binary parser per device model ourselves.

```
Tracker ──(vendor binary over TCP)──► Traccar ──(JSON over HTTPS)──► Our backend
```

---

## Step 1 — Download and install Traccar

Go to <https://www.traccar.org/download/>. You'll see four installer types. Pick **one**:

| OS | Installer | When to use |
|---|---|---|
| **Windows** | `traccar-windows-64-*.exe` | You're setting it up on your own Windows machine to try it out. Just double-click and run. |
| **Linux** | `traccar-linux-64-*.zip` | You're putting it on a Linux server for the team to use. |
| **macOS** | `.dmg` | Local trial on a Mac. |
| Docker image | `traccar/traccar` on Docker Hub | Production, if your team already runs Docker. Skip unless you specifically want this. |

For a first run on your dev machine the **Windows installer** is the fastest. Run it; accept defaults; it installs as a Windows service and starts automatically.

After install, open `http://localhost:8082` in a browser. You'll see Traccar's login screen.

---

## Step 2 — Create the admin user

The first time you open the web UI, click **Register** and create an account. This first account is automatically the admin. Use any email and a strong password — this is local to your Traccar instance.

You're now in the Traccar dashboard. Empty map, empty device list. That's expected.

---

## Step 3 — Register one device in Traccar

In our system, every physical tracker needs to be registered in two places: in **Traccar** (so it accepts the device's TCP connection) and in **our backend** (so we know which vehicle and which driver the device belongs to).

In Traccar:

1. Click **Devices** in the left sidebar.
2. Click **+ Add**.
3. Fill in:
   - **Name**: anything human-readable, e.g. `Bus TS09AB1234`
   - **Identifier**: the **IMEI** of the tracker — a 15-digit number printed on the device label and on its box
4. Click **Save**.

That's it. The device row appears in the list with a grey dot (offline). It'll turn green once a real device connects.

---

## Step 4 — Register the same device in our backend

Using the admin endpoints from [gps-tracker-integration.md §8](./gps-tracker-integration.md#8-admin-endpoints-for-vehicle--device-management):

```
POST /api/v1/admin/gps-devices
Body: { "imei": "865284040123456", "protocol": "traccar" }

Response:
{ "device_id": "...", "imei": "865284040123456",
  "ingest_secret": "abc123xyz..." }   ← copy this, you'll need it in Step 5
```

Then bind it to a vehicle:

```
POST /api/v1/admin/vehicles
Body: { "vehicle_number": "TS09AB1234", "vehicle_type": "BUS",
        "vehicle_capacity": 30, "gps_device_id": "<device_id from above>",
        "location_source": "GPS_DEVICE" }
```

---

## Step 5 — Tell Traccar to forward positions to our backend

This is the one bit of config that connects Traccar to us. **Do this once. It applies to every device, forever** (see "Scaling to many devices" below).

On the machine running Traccar, find the config file:

- **Windows**: `C:\Program Files\Traccar\conf\traccar.xml`
- **Linux**: `/opt/traccar/conf/traccar.xml`
- **macOS**: `/Library/Traccar/conf/traccar.xml`

> The installer in Step 1 already created this file and the surrounding `conf/`, `data/`, `logs/` folders. You don't need to create anything — just edit. `traccar.xml` will be short (a few lines) by default; alongside it you'll see a read-only `default.xml` containing every possible setting with its built-in value. `traccar.xml` is the "overlay" — anything you put there overrides `default.xml`.

Open it in a text editor (you'll need admin rights on Windows). Add these lines **inside** the `<properties>` block, anywhere before `</properties>`:

```xml
<entry key='forward.enable'>true</entry>
<entry key='forward.type'>json</entry>
<entry key='forward.url'>https://api.your-domain.com/api/v1/gps/ingest</entry>
<entry key='forward.header'>X-Device-Secret: abc123xyz...
Content-Type: application/json</entry>
```

What each line does:

- `forward.enable` — turns the forwarding feature on.
- `forward.type` — tells Traccar to send a JSON body (the alternative is URL placeholders; JSON is simpler).
- `forward.url` — the URL on our backend. For local dev use `http://localhost:3000/api/v1/gps/ingest` (or whatever port the backend runs on).
- `forward.header` — extra HTTP headers. The `X-Device-Secret` value is the `ingest_secret` you got back in Step 4. Our backend rejects anything without this header.

Save the file. **Restart Traccar** — without a restart the config isn't picked up:

- Windows: Services panel → Traccar → Restart
- Linux: `sudo systemctl restart traccar`
- macOS: `sudo launchctl unload ... && sudo launchctl load ...`

---

## Step 6 — Point the actual GPS device at Traccar

The tracker has to be told **where to dial home to**. Three values need to be set on the device:

| Setting | Value |
|---|---|
| Server host | The public IP or DNS of your Traccar machine. For local dev this is your laptop's LAN IP. The tracker must be able to reach it over the SIM card's network — meaning Traccar must be on the public internet for a real test. |
| Server port | The TCP port for **this specific device's protocol**. Look it up on <https://www.traccar.org/protocols/>. Common ones: GT06=`5023`, Teltonika=`5027`, Queclink=`5018`. Check the tracker's manual. |
| Reporting interval | How often to send a position. 10s while moving, 60s while idle is typical. |

How you set those values depends on the device:

- **SMS command** (cheapest, most common): text the SIM in the tracker something like `SERVER,1,1.2.3.4,5023,0#` — exact syntax is printed in the tracker's manual.
- **Vendor PC tool**: plug the device into a Windows laptop via USB and use the manufacturer's config app (e.g. Concox CRP, Teltonika Configurator).

After setting, power-cycle the device. Within ~60s you should see its dot turn **green** in Traccar's device list and start drawing on the live map.

---

## Step 7 — Verify the end-to-end flow

You don't need real hardware to test. Use the free **OsmAnd** Android app as a simulated tracker:

1. Install OsmAnd from the Play Store.
2. OsmAnd → Settings → Plugins → enable **Trip recording**.
3. Trip recording settings → **Online tracking** → set the URL to:

   `http://<your-traccar-host>:5055/?id=test-imei-12345&lat={0}&lon={1}&timestamp={2}&hdop={3}&altitude={4}&speed={5}`

   (Port `5055` is the built-in OsmAnd protocol in Traccar — already listening, no extra config needed.)
4. In Traccar, add a device with **Identifier = `test-imei-12345`**.
5. In our backend, register that same IMEI and link it to a test vehicle + open a test trip.
6. Walk around with the phone. Within seconds you should see:
   - OsmAnd's dot moving on Traccar's map
   - `POST /api/v1/gps/ingest` calls in our backend logs
   - `trip:position_update` events emitted to the parent room

If nothing arrives in our backend, check, in order:

1. **Tracker → Traccar**: is the device showing green in Traccar's list? If not, the device-side server IP/port is wrong, or a firewall is blocking the inbound port.
2. **Traccar → our backend**: open Traccar's `logs/tracker-server.log` (same `conf` folder, one level up). Successful forwards log `Forward 200`. A `Forward 401` means the `X-Device-Secret` is wrong. A `Forward 404` means the URL is wrong. Connection refused means the backend isn't reachable from Traccar.
3. **Backend → parent app**: this is plain socket debugging — same as the existing driver-app flow.

---

## Scaling to many devices

You won't have just one tracker — every bus gets one. Here's what repeats and what doesn't:

| Step | Per device? | Why |
|---|---|---|
| 1. Install Traccar | ❌ Once | One Traccar server handles all your devices. |
| 2. Create admin user | ❌ Once | Same Traccar UI account. |
| **3. Register device in Traccar** | ✅ **Per device** | Traccar needs to know each IMEI it should accept. |
| **4. Register device in our backend** | ✅ **Per device** | Backend needs to know which vehicle + driver each IMEI belongs to. |
| **5. Edit `traccar.xml` to forward** | ❌ **Once, ever** | One forwarding rule applies to ALL devices. |
| **6. Point the GPS hardware at Traccar** | ✅ **Per device** | Each physical box has to be configured to dial home. |
| 7. Verify | ❌ Once (or per device when troubleshooting) | |

So with 100 buses you do Steps 3, 4, 6 a hundred times — and Steps 1, 2, 5 exactly once.

### Why one forward rule covers everything

The `forward.url` and `forward.header` in `traccar.xml` are **server-wide**. When any device sends a position to Traccar, Traccar wraps it in JSON and POSTs it to that one URL. Each forwarded JSON body includes the IMEI:

```json
{
  "device":   { "uniqueId": "865284040123456", "name": "Bus TS09AB1234" },
  "position": { "latitude": 17.43, "longitude": 78.45, "speed": 32.5, "fixTime": "..." }
}
```

Our backend reads `device.uniqueId` (= the IMEI registered in Step 3 and Step 4), looks it up in `gps_devices`, walks `device → vehicle → current_driver_id → active trip`, and emits to the right `trip:{tripId}` room.

```
Bus 1 GPS ─┐
Bus 2 GPS ─┤
Bus 3 GPS ─┼─► one Traccar ─► one URL (POST /gps/ingest) ─► our backend routes by IMEI
...        │
Bus 100  ──┘
```

### What about the X-Device-Secret — is that per device?

No — that header is also **global**. Every device's position arrives at our backend with the same `X-Device-Secret` value. The split of responsibilities is:

- "Is this a legit Traccar?" → checked via the global `X-Device-Secret` header.
- "Which device sent this?" → identified by the IMEI inside the JSON body.

This is fine for our model. The tradeoff: if that one global secret leaks, anyone who knows it can forge positions for any IMEI. Standard mitigations:

1. Allowlist the Traccar host's outbound IP at our backend's firewall/WAF — only Traccar can hit `/gps/ingest`.
2. Rotate the secret periodically (update `traccar.xml`, restart Traccar; brief overlap window in our backend during cutover).

Per-device secrets aren't natively supported by Traccar in one instance. If we ever need that isolation we'd run multiple Traccar instances (one per tenant/school) — overkill for now.

---

## What to do next (only when you actually need it)

The above is enough to get GPS positions flowing end-to-end. Things to come back to **later**, not now:

- Putting Traccar behind HTTPS with a reverse proxy (Caddy/nginx) so the web UI isn't on plain HTTP in production.
- Switching Traccar's built-in H2 database to PostgreSQL for better backup/restore.
- Allowlisting Traccar's outbound IP at our backend's WAF so only it can hit `/gps/ingest`.
- Rotating the `X-Device-Secret`.

If/when those are needed, we'll write them up separately. For now: install → admin user → register device in Traccar → register in our backend → enable forwarding → point tracker at Traccar → verify.
