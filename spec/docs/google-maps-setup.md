# Google Maps API Setup

Used for: route optimization, distance/duration calculations, traffic-aware routing via the **Directions API**.

---

## Setup Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a new project
2. Navigate to **APIs & Services → Library**
3. Search and **Enable**: `Directions API` (required), `Distance Matrix API` (optional)
4. Go to **APIs & Services → Credentials → + CREATE CREDENTIALS → API Key**
5. Copy the generated key
6. Add to your env file:
   ```
   GOOGLE_MAPS_API_KEY=AIzaSy...
   ```
7. Restart the server → look for `[INFO] Google Maps API initialized`

---

## Key Restrictions (Production)

1. Open the key in **Credentials**
2. Under **API restrictions** → select the enabled APIs
3. Under **Application restrictions** → choose **IP addresses** → add your server's public IP
4. Save

> Use separate keys for dev and production. Rotate every 6–12 months.

---

## Verify

Test the route endpoint:
```
POST /api/trips/directions
{ "start_latitude": ..., "start_longitude": ..., "waypoints": [...] }
```

Expected: `{ "success": true, "data": { "sequence": [...], "totalDistance": ..., "coordinates": [...] } }`

---

## Common Errors

| Error | Fix |
|-------|-----|
| `GOOGLE_MAPS_API_KEY not configured` | Check `environment/.env.dev`, restart server |
| `REQUEST_DENIED` / `INVALID_REQUEST` | API not enabled, wrong key, or IP not in allowlist |
| HTTP 403 | Enable billing in Google Cloud Console + verify Directions API is enabled |
| `OVER_QUERY_LIMIT` | Add billing account / increase quotas |
| `ZERO_RESULTS` | Invalid coordinates or route not driveable |
