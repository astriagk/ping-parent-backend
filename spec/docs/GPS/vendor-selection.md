# GPS Vendor Selection — Do We Need Traccar At All?

## Context

A vendor has quoted **₹2,800 per device + ₹3,000/year for "application + SIM + APIs for data"**. The question is whether we still need [Traccar](./traccar-setup.md) in the middle, or whether we can drop it and let the vendor's cloud talk to our backend directly.

The decision hinges on one technical detail about the vendor's offering. This doc explains how to extract that detail and what to do with each possible answer.

---

## The one question that decides everything

> **"Do you push positions to a webhook URL on our server, or do we have to poll your REST API for the latest position?"**

Two completely different worlds depending on the answer.

| Model | How it works | Real-time? | Effort on our side |
|---|---|---|---|
| **Webhook (push)** | Vendor's cloud POSTs each new position to a URL we host, like Traccar's "forward" feature. | ✅ Yes — sub-second after a fix. | Build `POST /api/v1/gps/ingest` (already planned). |
| **Polling (pull)** | We call vendor's REST API like `GET /devices/{imei}/position` every N seconds to fetch the latest. | ⚠️ 5–30s lag. Parents will feel it. | Build a recurring worker + per-vehicle polling loop. More moving parts. |

If their answer is **webhook**, drop Traccar from the plan — the vendor's cloud plays the same role Traccar would. If it's **polling**, we either accept the lag or buy a different device that speaks an open protocol and run Traccar ourselves.

---

## Decision tree

```
Vendor offers webhook push?
├── YES → Don't use Traccar. Build POST /api/v1/gps/ingest in our backend;
│         vendor POSTs to it directly. ~95% of gps-tracker-integration.md
│         still applies; only the source of the POST changes (vendor instead
│         of Traccar). Adjust JSON field names to match their schema.
│
└── NO, only polling API
    ├── Latency ≤10s acceptable
    │   → Write a small worker that polls every 10s and feeds positions into
    │     the same ingestLocation() core. Skip Traccar.
    │
    └── Latency too high OR quotas/rate limits too tight
        → Buy a tracker that speaks an open protocol (GT06, Teltonika,
          Queclink) and self-host Traccar instead. Ignore the vendor's API.
```

For ~80% of vendors in this price band the answer is "yes, webhook" → **drop Traccar from the plan.**

---

## Questions to ask the vendor before paying

Walk through these on a call or email. Get answers in writing.

1. **Push or poll?** Webhook to our URL, or do we call yours? *(the make-or-break question)*
2. **Can the webhook URL be set per account, and can we change it later ourselves?** Some vendors require a support ticket to update the URL — annoying when DNS or domains change.
3. **What's in the webhook body?** Lat, lng, speed, heading, accuracy, fix timestamp, IMEI — these are the minimum we need. Get a sample JSON.
4. **What auth method on the webhook?** Shared secret in a header is fine. OAuth means extra work. Plain IP allowlist is also workable.
5. **Latency end-to-end** — device fix → their cloud → our webhook. Ask for typical and worst-case numbers.
6. **Update frequency** — how often does the device transmit while moving? 10s is normal. Some default to 60s and you have to ask them to lower it.
7. **History API** — can we fetch past positions for a given device + time range? Useful for trip reports and dispute resolution.
8. **SLA / uptime** — what happens when their cloud is down? Do positions buffer on-device and replay?
9. **What happens when the SIM data runs out or the annual renewal lapses?** Some vendors hard-disable the device until paid; some keep it forwarding.
10. **AIS-140 compliance** — if we ever need to operate as a registered school transporter in India, the device must be AIS-140 certified. Ask explicitly; don't accept "compatible".
11. **Open protocol or locked?** Can the same physical device be reconfigured later to point at our own server (or Traccar), or is its firmware locked to their cloud forever? This is the lock-in question.
12. **Volume pricing** — ₹3,000/year/device for 5 devices is fine. For 100, ask for a slab.
13. **Cancellation / portability** — if we stop paying, do we get a final export of historical data?

---

## Pricing reality check

The quote breaks down as roughly:

| Item | Quote | Market context |
|---|---|---|
| Device (one-time) | ₹2,800 | Reasonable. Bare consumer trackers are ₹1,200–2,000. AIS-140 compliant ones are ₹3,500–6,000. ₹2,800 sits between — verify whether AIS-140 is included. |
| Year 1: SIM + cloud + API | ₹3,000 | Reasonable **if webhook is included**. Polling-only at this price is a bit high since you're paying for their UI you won't use. |
| Year 2+ | Likely same ₹3,000/yr | Confirm — some vendors raise it after year 1. |

**Total for 100 vehicles**: ~₹2.8L one-time + ~₹3L/year recurring.

**Comparison — self-host Traccar + buy your own SIMs**:

- VM for Traccar: ~₹500–1,000/month (~₹12K/yr)
- M2M SIM per device: ~₹100/month = ~₹12K/yr per 100 SIMs
- Bare devices (cheaper since no SaaS): ~₹1,500–2,500 each one-time
- **Total**: ~₹2L one-time + ~₹24K/yr recurring

So self-host is ~₹2.7L cheaper per year at 100 vehicles. But you trade that saving for:

- Running Traccar (uptime, upgrades, backups)
- Sourcing and provisioning SIMs yourself
- Owning device firmware updates if the vendor disappears

For your scale and stage, the vendor bundle is **simpler and worth the premium**. Revisit self-hosting only if you scale past a few hundred vehicles.

---

## Where to look for vendors (so you can compare)

Get at least 2–3 quotes with the same checklist above before committing. Indian vendors in this segment:

- **Onelap** (<https://onelap.in>) — popular for fleet, has a documented API.
- **AIS-140 vendors directory** — search "AIS-140 GPS tracker manufacturer" on IndiaMART for a long list.
- **Sinotrack distributors** — cheaper devices; API quality varies wildly between distributors.
- **Pricol Logistics / iTriangle / Roadcast** — enterprise-grade, AIS-140 certified, more expensive.
- **Locate365 / Aquila Track** — known for cleaner developer-facing APIs.
- **GPS Gaadi / TrackOlap** — smaller players, often more flexible on custom integration.

Whoever answers **"yes, webhook push"** AND **"yes, AIS-140 certified"** at a competitive price is the safer pick.

---

## What this means for our backend plan

The architecture in [gps-tracker-integration.md](./gps-tracker-integration.md) doesn't change much in either path:

### If vendor offers webhook (most likely)

- ✅ Keep all of `Vehicle`, `GPSDevice`, `LocationSource`, the policy gate, and `ingestLocation()` exactly as planned.
- ✅ Keep `POST /api/v1/gps/ingest` exactly as planned.
- 🔄 The handler parses the **vendor's JSON schema** instead of Traccar's. Field names will differ (e.g. `lat` vs `latitude`, `device_id` vs `uniqueId`, ISO timestamp vs epoch ms). Write a small `parseVendorXPayload()` and call `ingestLocation()` with normalized fields.
- ❌ No Traccar instance to run.
- ❌ [traccar-setup.md](./traccar-setup.md) becomes background reading only — useful if we ever switch vendors or self-host later.

### If vendor offers polling only

- ✅ Keep all of `Vehicle`, `GPSDevice`, `LocationSource`, `ingestLocation()` as planned.
- ➕ Add a **poller service** (cron-style or interval timer) that for each `GPSDevice` with `is_active = true` calls the vendor API every N seconds, normalizes the response, and calls `ingestLocation()`.
- ⚠️ Mind the vendor's rate limits — you may need batched endpoints (`GET /devices/positions?ids=...`) rather than per-device calls.
- ❌ No Traccar.

### If vendor's offering is too limited

- Buy AIS-140 devices that speak an open protocol independently and use Traccar as originally planned in [traccar-setup.md](./traccar-setup.md).

---

## Recommendation

1. **Don't pay the vendor yet.** Send them the questions in the checklist above.
2. **Get 2 more quotes** from at least one other vendor for comparison.
3. Pick based on: webhook support → AIS-140 → API quality → price (in that order).
4. Once selected, this doc gets a follow-up titled `vendor-<name>-integration.md` capturing their actual JSON schema and webhook auth so the `gps-ingest.controller.ts` can be implemented against real specs.
