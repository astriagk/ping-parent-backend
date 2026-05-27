# GPS Push Endpoint — Usage Spec

## Endpoint

```
POST /api/public/gps/push
```

---

## Request

### Headers

| Header         | Value              | Required |
| -------------- | ------------------ | -------- |
| `Content-Type` | `application/json` | Yes      |

### Body

| Field       | Type   | Required | Constraints                       | Description                                              |
| ----------- | ------ | -------- | --------------------------------- | -------------------------------------------------------- |
| `vnum`      | string | **Yes**  | —                                 | Vehicle identifier (e.g. "Astria")                       |
| `datetime`  | string | **Yes**  | `YYYY/MM/DD HH:MM:SS`             | Timestamp from the device                                |
| `latitude`  | number | **Yes**  | -90 to 90                         | Decimal degrees (WGS84)                                  |
| `longitude` | number | **Yes**  | -180 to 180                       | Decimal degrees (WGS84)                                  |
| `speed`     | number | No       | ≥ 0                               | Speed in km/h — **omit the field** if unavailable        |
| `heading`   | number | No       | 0 to 360                          | Direction in degrees (0 = North) — **omit** if unavailable |
| `accuracy`  | number | No       | ≥ 0                               | GPS error radius in metres — **omit** if unavailable     |

> `0` is a valid value for `speed` (stationary), `heading` (facing North), and `accuracy` (exact fix).

---

## Example Request

### curl

```bash
curl -X POST https://api.skolo.astriagk.com/api/public/gps/push \
  -H "Content-Type: application/json" \
  -d '{
    "vnum": "Astria",
    "datetime": "2026/05/25 18:35:43",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "speed": 40.5,
    "heading": 180,
    "accuracy": 0
  }'
```

### Postman

- Method: `POST`
- URL: `https://api.skolo.astriagk.com/api/public/gps/push`
- Body → raw → JSON:

```json
{
  "vnum": "Astria",
  "datetime": "2026/05/25 18:35:43",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 40.5,
  "heading": 180,
  "accuracy": 0
}
```

---

## Response

### Success — 200 OK

```json
{
  "success": true,
  "received": {
    "vnum": "Astria",
    "datetime": "2026/05/25 18:35:43",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "speed": 40.5,
    "heading": 180,
    "accuracy": 0
  }
}
```

### Validation Error — 400 Bad Request

```json
{
  "success": false,
  "message": "\"vnum\" is required"
}
```

---

## Server Console Output

```
[GPS] 2026/05/25 18:35:43 | vnum: Astria, lat: 12.9716, lng: 77.5946, speed: 40.5, heading: 180, accuracy: 0
```

---

## Local Development

```
http://localhost:3000/api/public/gps/push
```

Replace `3000` with the actual port from your `.env` (`PORT=`).

---

## Notes

- Does not persist data to the database. Entry point for GPS hardware integration.
- Future versions will resolve the active trip via `vnum` and feed data into the live tracking pipeline (see [gps-tracker-integration.md](./gps-tracker-integration.md)).
