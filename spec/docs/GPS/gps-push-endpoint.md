# GPS Push Endpoint — Usage Spec

## Endpoint

```
POST /api/public/gps/push
```

- **No authentication required**
- **No trip ID required**
- Received data is logged to the server console and echoed back in the response

---

## Request

### Headers

| Header         | Value              | Required |
| -------------- | ------------------ | -------- |
| `Content-Type` | `application/json` | Yes      |

### Body

| Field       | Type   | Required | Constraints | Description                      |
| ----------- | ------ | -------- | ----------- | -------------------------------- |
| `latitude`  | number | **Yes**  | -90 to 90   | Decimal degrees (WGS84)          |
| `longitude` | number | **Yes**  | -180 to 180 | Decimal degrees (WGS84)          |
| `speed`     | number | No       | ≥ 0         | Speed in km/h                    |
| `heading`   | number | No       | 0 to 360    | Direction in degrees (0 = North) |
| `accuracy`  | number | No       | ≥ 0         | GPS accuracy in meters           |

---

## Example Request

### curl

```bash
curl -X POST https://api.skolo.astriagk.com/api/public/gps/push \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 12.9716,
    "longitude": 77.5946,
    "speed": 40.5,
    "heading": 180,
    "accuracy": 5.0
  }'
```

### Minimal (lat/lng only)

```bash
curl -X POST https://api.skolo.astriagk.com/api/public/gps/push \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

### Postman

- Method: `POST`
- URL: `https://api.skolo.astriagk.com/api/public/gps/push`
- Body → raw → JSON:

```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 40.5,
  "heading": 180,
  "accuracy": 5.0
}
```

---

## Response

### Success — 200 OK

```json
{
  "success": true,
  "received": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "speed": 40.5,
    "heading": 180,
    "accuracy": 5.0
  }
}
```

### Validation Error — 400 Bad Request

Returned when `latitude` or `longitude` is missing or out of range.

```json
{
  "success": false,
  "message": "\"latitude\" is required"
}
```

---

## Server Console Output

Every accepted push prints a line to the server terminal:

```
[GPS] 2026-05-25T10:30:00.000Z { latitude: 12.9716, longitude: 77.5946, speed: 40.5, heading: 180, accuracy: 5 }
```

---

## Local Development

If running locally, the base URL is:

```
http://localhost:3000/api/public/gps/push
```

Replace `3000` with the actual port from your `.env` (`PORT=`).

---

## Notes

- This endpoint is intentionally unauthenticated and does **not** persist data to the database. It is the entry point for GPS hardware integration.
- Future versions will accept an IMEI, resolve the active trip, and feed the data into the live tracking pipeline (see [gps-tracker-integration.md](./gps-tracker-integration.md)).
