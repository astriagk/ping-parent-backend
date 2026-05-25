# Vendor RFQ Email — GPS Tracker

A reusable email template for requesting specifications, pricing, and service details from GPS tracker vendors. Copy the section below into your mail client and fill in the bracketed placeholders.

---

**Subject:** Request for Information — GPS Tracking Devices

Dear Sir / Madam,

We are writing to enquire about your GPS tracking devices and would like to request the following information for our evaluation.

**1. Device Specifications**

- Connectivity — 4G LTE with 2G fallback.
- AIS-140 certification status and certificate number.
- Power — hard-wired to vehicle battery with internal backup; backup runtime when the vehicle is off.
- GNSS positional accuracy in metres.
- Reporting interval while moving and while idle, and whether it is configurable.
- Tamper alert when the device is removed or power is disconnected.
- Panic button input (AIS-140 requirement).

**2. Data Delivery**

- Real-time data delivery method — whether positions are pushed to a webhook URL on our server, or whether we are required to poll your API.
- Position payload fields — latitude, longitude, speed, heading, timestamp, and IMEI.
- On-board buffering of positions during loss of network, and replay on reconnection.
- Sample JSON payload for our reference.

**3. Device Cost**

- Per-device price, inclusive of GST.
- Volume pricing for bulk orders.

**4. Service**

- Warranty period.
- Installation support.
- Customer support channels and availability.

**5. Annual Recurring Cost**

- Annual cost per device.
- Inclusions and exclusions in the annual cost.

We would appreciate a written response at your earliest convenience, so we may review the details at our end.

Thank you for your time.

Best regards,
[Your Name]
[Your Designation]
[Phone / Email]

---

## Tips for using this template

- Send the same email to 2–3 vendors so you can compare responses side by side.
- Point 2, first bullet (webhook push vs polling) is the most consequential answer. If a vendor is vague, follow up until the answer is clear. This decision drives the rest of the backend design — see [gps-tracker-integration.md](./gps-tracker-integration.md) and [vendor-selection.md](./vendor-selection.md).
- Keep responses in writing so there is a paper trail of commitments.
