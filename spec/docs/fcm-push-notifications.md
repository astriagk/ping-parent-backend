# FCM Push Notifications

## How It Works

Every driver action (pickup / drop / approaching) fires 3 layers automatically:

| Layer | When | Purpose |
|-------|------|---------|
| Socket.IO | App open & connected | Real-time events |
| FCM Push | App background / killed | System tray notification |
| DB Record | Always | In-app notification history |

---

## Backend Setup

1. Go to Firebase Console → **Project Settings → Service Accounts**
2. Click **Generate New Private Key** → rename to `firebase-service-account.json`
3. Place at `environment/firebase-service-account.json` (gitignored — never commit)
4. Start the server — look for `[FCM] Firebase Admin SDK initialized successfully`

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/shared/device-tokens/register` | Register FCM token after login |
| POST | `/api/shared/device-tokens/remove` | Remove token on logout |
| GET | `/api/shared/notifications/preferences` | Get push on/off setting |
| PUT | `/api/shared/notifications/preferences` | Toggle push on/off |
| GET | `/api/shared/notifications` | All notifications |
| GET | `/api/shared/notifications/unread-count` | Unread count |
| PUT | `/api/shared/notifications/:id/mark-as-read` | Mark one read |
| PUT | `/api/shared/notifications/mark-all-as-read` | Mark all read |

Register request body:
```json
{ "fcm_token": "...", "device_type": "android", "device_id": "stable-device-id" }
```

> `device_id` is required. Use Android ID or iOS `identifierForVendor`.

---

## Flutter Integration

1. Add dependencies: `firebase_core`, `firebase_messaging`, `flutter_local_notifications`
2. Run `flutterfire configure` to generate `firebase_options.dart`
3. Register background handler as a **top-level function** with `@pragma('vm:entry-point')`
4. After login: call `FirebaseMessaging.instance.getToken()` → POST to `/device-tokens/register`
5. Listen for token refresh via `onTokenRefresh` → re-register
6. Handle foreground messages with `FirebaseMessaging.onMessage` → show local notification
7. Handle taps with `FirebaseMessaging.onMessageOpenedApp` → navigate by `notification_type`
8. On logout: call `/device-tokens/remove` with the current token

**Android**: Add `POST_NOTIFICATIONS` permission + notification channel `ping_parent_notifications`
**iOS**: Enable Push Notifications + Background Modes capabilities in Xcode; upload APNs key in Firebase Console

---

## Notification Types

| Type | Trigger |
|------|---------|
| `picked_up` | Driver picks up student |
| `dropped` | Driver drops off student |
| `approaching` | Driver nearing pickup location |
| `absent` | Student marked absent |
| `trip_started` | Trip begins |
| `trip_completed` | Trip ends |
| `payment_due` | Payment reminder |

FCM data payload always includes: `notification_type`, `tripId`, `studentId`, `studentName`, `driverId`

---

## Database Collections

**`device_tokens`** — one record per device per user (multi-device supported)
**`notification_preferences`** — one record per user (`push_enabled: true` default)

Upsert key: `user_id` + `device_id` (prevents duplicates on token refresh)
