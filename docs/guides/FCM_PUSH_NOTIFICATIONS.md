# FCM Push Notifications — Testing & Flutter Integration Guide

**Version**: 1.0.0
**Last Updated**: March 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Backend Setup](#backend-setup)
3. [API Endpoints](#api-endpoints)
4. [Testing with Postman / cURL](#testing-with-postman--curl)
5. [Flutter Integration](#flutter-integration)
6. [Notification Types Reference](#notification-types-reference)
7. [Architecture](#architecture)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The notification system has **3 layers**:

| Layer | When It Works | Purpose |
|-------|--------------|---------|
| **Socket.IO** | App is open & connected | Real-time map updates, live tracking |
| **FCM Push** | App is closed / background / killed | System-level notification on device |
| **DB Record** | Always | In-app notification history (bell icon) |

When a driver picks up/drops a student, **all 3 fire automatically** — the Flutter app just needs to register its FCM token once.

---

## Backend Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (or use existing)
3. Go to **Project Settings > Service Accounts**
4. Click **Generate New Private Key** — downloads a JSON file
5. Rename it to `firebase-service-account.json`
6. Place it at: `environment/firebase-service-account.json`

> This file is gitignored. Never commit it.

### 2. Environment Variable (Optional)

In `environment/.env.dev` or `.env.prod`:
```
FIREBASE_SERVICE_ACCOUNT_PATH=./environment/firebase-service-account.json
```

### 3. Verify Server Startup

Start the server:
```bash
npm run dev
```

Look for this log:
```
[FCM] Firebase Admin SDK initialized successfully
```

If you see this instead, FCM is disabled (socket + DB still work):
```
[FCM] Failed to initialize Firebase Admin SDK: ...
```

---

## API Endpoints

### Register Device Token

Called by Flutter app after login to register the FCM token.

```
POST /api/shared/device-tokens/register
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fcm_token": "cKl9x2...(FCM registration token)",
  "device_type": "android",    // "android" | "ios" | "web"
  "device_id": "unique-id"     // REQUIRED - stable device identifier (Android ID, iOS identifierForVendor)
}
```

**Response:**
```json
{
  "success": true,
  "data": { "id": "67a1b2c3d4e5f6..." },
  "message": "Device token registered successfully"
}
```

### Remove Device Token

Called on logout to stop receiving push notifications.

```
POST /api/shared/device-tokens/remove
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fcm_token": "cKl9x2...(FCM registration token)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device token removed successfully"
}
```

### Notification Preferences

Toggle push notifications on/off globally for the user. Default is `push_enabled: true`.

**Get preferences:**
```
GET /api/shared/notifications/preferences
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": { "push_enabled": true },
  "message": "Notification preferences fetched successfully"
}
```

**Update preferences:**
```
PUT /api/shared/notifications/preferences
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "push_enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "data": { "push_enabled": false },
  "message": "Notification preferences updated successfully"
}
```

> When `push_enabled` is `false`, FCM push notifications are skipped but Socket.IO events and DB records are still created (so in-app notification history works).

### Existing Notification Endpoints

These were already available — now they'll have actual data:

```
GET  /api/shared/notifications              — Get all notifications
GET  /api/shared/notifications/unread        — Get unread notifications
GET  /api/shared/notifications/unread-count  — Get unread count
PUT  /api/shared/notifications/:id/mark-as-read  — Mark one as read
PUT  /api/shared/notifications/mark-all-as-read  — Mark all as read
```

---

## Testing with Postman / cURL

### Step 1: Get a Test FCM Token

**Option A: From Flutter app**
Add this debug code temporarily in your Flutter app:
```dart
final token = await FirebaseMessaging.instance.getToken();
print('FCM Token: $token');
```

**Option B: From Firebase Console**
1. Go to Firebase Console > Cloud Messaging
2. Send a test message > Enter a device token (you need the app running)

### Step 2: Register the Token

```bash
curl -X POST http://localhost:3000/api/shared/device-tokens/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcm_token": "YOUR_FCM_TOKEN_FROM_STEP_1",
    "device_type": "android",
    "device_id": "YOUR_DEVICE_ID"
  }'
```

### Step 3: Trigger a Notification

Trigger a student pickup via the existing driver API:

```bash
# Record student pickup (driver auth token required)
curl -X PATCH http://localhost:3000/api/driver/trip-students/TRIP_ID/STUDENT_ID/pickup \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_otp": "1234"
  }'
```

### Step 4: Verify All 3 Layers

1. **FCM Push**: Check the device — you should see a system notification
2. **DB Record**: Query the notifications endpoint:
   ```bash
   curl http://localhost:3000/api/shared/notifications \
     -H "Authorization: Bearer PARENT_JWT_TOKEN"
   ```
3. **Socket.IO**: If parent app is connected, check for `parent:my_student_picked` event

### Step 5: Verify DB Directly (MongoDB)

```javascript
// Check device_tokens collection
db.device_tokens.find({ user_id: "USER_ID" })

// Check notifications collection (should have new records)
db.notifications.find({ user_id: "USER_ID" }).sort({ created_at: -1 }).limit(5)
```

### Step 6: Test Token Removal (Logout)

```bash
curl -X POST http://localhost:3000/api/shared/device-tokens/remove \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcm_token": "YOUR_FCM_TOKEN"
  }'
```

After removal, trigger another pickup — no push notification should arrive.

---

## Flutter Integration

### Step 1: Add Dependencies

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^3.8.0
  firebase_messaging: ^15.2.0
  flutter_local_notifications: ^18.0.0
```

Run:
```bash
flutter pub get
flutterfire configure   # generates firebase_options.dart
```

### Step 2: Android Configuration

**`android/app/src/main/AndroidManifest.xml`** — add inside `<manifest>`:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

Add inside `<application>`:
```xml
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="ping_parent_notifications" />
```

**`android/app/build.gradle`** — ensure:
```gradle
android {
    defaultConfig {
        minSdkVersion 21  // minimum for FCM
    }
}
```

### Step 3: iOS Configuration

1. Open `ios/Runner.xcworkspace` in Xcode
2. Select Runner target > **Signing & Capabilities**
3. Click **+ Capability** > Add **Push Notifications**
4. Click **+ Capability** > Add **Background Modes** > Check **Remote notifications**
5. In Firebase Console > Project Settings > Cloud Messaging > iOS:
   - Upload your APNs Authentication Key (`.p8` file)
   - Or upload APNs certificate (`.pem` file)

### Step 4: Initialize Firebase in main.dart

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'firebase_options.dart';

// MUST be a top-level function (not inside a class)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  // Background message received — the system notification is shown automatically
  // You can process data here if needed (e.g., update local DB)
  print('Background message: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Register background handler BEFORE runApp
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  runApp(MyApp());
}
```

### Step 5: Create Push Notification Service

```dart
import 'dart:io' show Platform;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  // Call this ONCE after successful login
  Future<void> initialize({
    required String authToken,
    required String deviceId,
    required Function(String fcmToken, String deviceId) apiRegisterToken,
    required Function(RemoteMessage) onNotificationTapped,
  }) async {
    // 1. Request permission (required for iOS, Android 13+)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus != AuthorizationStatus.authorized &&
        settings.authorizationStatus != AuthorizationStatus.provisional) {
      print('Push notifications denied by user');
      return;
    }

    // 2. Setup local notifications (for foreground display)
    await _setupLocalNotifications();

    // 3. Get FCM token and register with backend
    final fcmToken = await _messaging.getToken();
    if (fcmToken != null) {
      await apiRegisterToken(fcmToken, deviceId);
      print('FCM Token registered: ${fcmToken.substring(0, 20)}...');
    }

    // 4. Listen for token refresh (tokens can change)
    _messaging.onTokenRefresh.listen((newToken) {
      apiRegisterToken(newToken, deviceId);
      print('FCM Token refreshed and re-registered');
    });

    // 5. Handle foreground messages (app is open)
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 6. Handle notification tap when app was in background
    FirebaseMessaging.onMessageOpenedApp.listen(onNotificationTapped);

    // 7. Handle notification tap that launched the app (was terminated)
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      // Delay slightly to ensure navigation is ready
      Future.delayed(const Duration(milliseconds: 500), () {
        onNotificationTapped(initialMessage);
      });
    }
  }

  Future<void> _setupLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false, // Already requested above
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _localNotifications.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
    );

    // Create the notification channel (Android)
    const channel = AndroidNotificationChannel(
      'ping_parent_notifications', // Must match backend channelId
      'Ping Parent Notifications',
      description: 'Trip and student notifications',
      importance: Importance.high,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    // Show local notification since FCM doesn't auto-show in foreground
    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'ping_parent_notifications',
          'Ping Parent Notifications',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: message.data['notification_type'],
    );
  }

  // Call on logout
  Future<String?> getToken() async {
    return await _messaging.getToken();
  }
}
```

### Step 6: API Service — Register/Remove Token

```dart
class NotificationApiService {
  final Dio _dio; // Your existing Dio instance with base URL + auth interceptor

  NotificationApiService(this._dio);

  /// Register FCM token with backend
  Future<void> registerToken(String fcmToken, String deviceId) async {
    await _dio.post('/shared/device-tokens/register', data: {
      'fcm_token': fcmToken,
      'device_type': Platform.isAndroid ? 'android' : 'ios',
      'device_id': deviceId,
    });
  }

  /// Remove FCM token (call on logout)
  Future<void> removeToken(String fcmToken) async {
    await _dio.post('/shared/device-tokens/remove', data: {
      'fcm_token': fcmToken,
    });
  }

  /// Get all notifications
  Future<List<dynamic>> getNotifications() async {
    final response = await _dio.get('/shared/notifications');
    return response.data['data'];
  }

  /// Get unread count
  Future<int> getUnreadCount() async {
    final response = await _dio.get('/shared/notifications/unread-count');
    return response.data['data']['unread_count'];
  }

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    await _dio.put('/shared/notifications/$notificationId/mark-as-read');
  }

  /// Mark all as read
  Future<void> markAllAsRead() async {
    await _dio.put('/shared/notifications/mark-all-as-read');
  }

  /// Get notification preferences
  Future<bool> getPushEnabled() async {
    final response = await _dio.get('/shared/notifications/preferences');
    return response.data['data']['push_enabled'];
  }

  /// Update notification preferences (on/off toggle)
  Future<void> setPushEnabled(bool enabled) async {
    await _dio.put('/shared/notifications/preferences', data: {
      'push_enabled': enabled,
    });
  }
}
```

### Step 7: Wire It All Together

```dart
// ============================================
// After successful login
// ============================================

final pushService = PushNotificationService();
final notificationApi = NotificationApiService(dio);

// Get a stable device ID (use android_id / device_info_plus package)
// Android: Settings.Secure.ANDROID_ID
// iOS: UIDevice.identifierForVendor
final deviceId = await getDeviceId(); // your implementation

await pushService.initialize(
  authToken: accessToken,
  deviceId: deviceId,
  apiRegisterToken: (fcmToken, deviceId) =>
      notificationApi.registerToken(fcmToken, deviceId),
  onNotificationTapped: (message) {
    // Navigate based on notification type
    final type = message.data['notification_type'];
    final tripId = message.data['tripId'];

    switch (type) {
      case 'picked_up':
      case 'dropped':
      case 'approaching':
        if (tripId != null) {
          // Navigate to trip tracking screen
          Navigator.of(context).pushNamed('/trip-tracking', arguments: tripId);
        }
        break;
      case 'absent':
        // Navigate to trip details or notifications
        Navigator.of(context).pushNamed('/notifications');
        break;
      case 'payment_due':
        Navigator.of(context).pushNamed('/payments');
        break;
      default:
        Navigator.of(context).pushNamed('/notifications');
    }
  },
);

// ============================================
// On logout
// ============================================

final fcmToken = await pushService.getToken();
if (fcmToken != null) {
  await notificationApi.removeToken(fcmToken);
}
```

### Step 8: Notification History Screen (Optional)

```dart
class NotificationsScreen extends StatefulWidget {
  @override
  _NotificationsScreenState createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _loading = true);
    try {
      final notifications = await notificationApi.getNotifications();
      setState(() {
        _notifications = notifications;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    if (_notifications.isEmpty) {
      return const Center(child: Text('No notifications yet'));
    }

    return RefreshIndicator(
      onRefresh: _loadNotifications,
      child: ListView.builder(
        itemCount: _notifications.length,
        itemBuilder: (context, index) {
          final notif = _notifications[index];
          final isRead = notif['is_read'] == true;

          return ListTile(
            leading: Icon(
              _getIconForType(notif['notification_type']),
              color: isRead ? Colors.grey : Colors.blue,
            ),
            title: Text(
              notif['title'],
              style: TextStyle(
                fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
              ),
            ),
            subtitle: Text(notif['message']),
            trailing: Text(
              _timeAgo(DateTime.parse(notif['created_at'])),
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            onTap: () async {
              if (!isRead) {
                await notificationApi.markAsRead(notif['_id']);
                _loadNotifications();
              }
            },
          );
        },
      ),
    );
  }

  IconData _getIconForType(String? type) {
    switch (type) {
      case 'picked_up':
        return Icons.check_circle;
      case 'dropped':
        return Icons.location_on;
      case 'approaching':
        return Icons.directions_car;
      case 'absent':
        return Icons.cancel;
      case 'trip_started':
        return Icons.play_arrow;
      case 'trip_completed':
        return Icons.flag;
      case 'payment_due':
        return Icons.payment;
      default:
        return Icons.notifications;
    }
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
```

---

## Notification Types Reference

These are the `notification_type` values sent in both push data and DB records:

| Type | Trigger | Title | Example Message |
|------|---------|-------|----------------|
| `picked_up` | Driver picks up student | Student Picked Up | Your child John has been picked up |
| `dropped` | Driver drops off student | Student Dropped Off | Your child John has been dropped off |
| `approaching` | Driver nearing student location | Driver Approaching | Driver is approaching for John - ETA 3 minutes |
| `absent` | Student marked absent | Student Marked Absent | Your child John was marked absent |
| `trip_started` | Trip begins | Trip Started | Your trip has started |
| `trip_completed` | Trip finishes | Trip Completed | Your trip has been completed |
| `payment_due` | Payment reminder | Payment Due | Your subscription payment is due |
| `general` | General notification | — | — |

### Push Notification Data Payload

Every FCM push includes a `data` payload with these fields:

```json
{
  "notification_type": "picked_up",
  "tripId": "67a1b2c3...",
  "studentId": "67d4e5f6...",
  "studentName": "John",
  "driverId": "67g8h9i0..."
}
```

Use `message.data['notification_type']` and `message.data['tripId']` in Flutter for navigation.

---

## Architecture

```
                DRIVER ACTION (pickup / drop / approaching)
                              |
                              v
               trip_student.service.ts
                              |
                              v
               NotificationDispatcher.*()
                    /         |         \
                   /          |          \
                  v           v           v
           Socket.IO     Preferences     DB Save
           (real-time)    check          (history)
              |               |              |
              v               v              v
         Parent app    push_enabled?     GET /notifications
         (if open)      /       \        (in-app bell icon)
                       v         v
                     YES         NO
                      |          |
                      v          v
                  FCM Push    Skip FCM
                (background)
                      |
                      v
                System tray
                notification
```

### Files Created / Modified

**Module: `src/modules/device_token/`** — FCM device token management
- `device-token.type.ts` — DeviceToken interface
- `device-token.repository.ts` — Token CRUD (upsert with multi-device support)
- `device-token.service.ts` — Business logic (register, remove, query tokens)
- `device-token.controller.ts` — REST endpoint handlers
- `device-token.routes.ts` — Handler group (`deviceTokenHandlers`)
- `device-token.validation.ts` — Joi schemas

**Module: `src/modules/notification_preferences/`** — Push notification on/off toggle
- `notification-preferences.type.ts` — NotificationPreferences interface
- `notification-preferences.repository.ts` — Preferences CRUD (upsert per user)
- `notification-preferences.service.ts` — Business logic (get/update preferences, `isPushEnabled`)
- `notification-preferences.controller.ts` — REST endpoint handlers
- `notification-preferences.routes.ts` — Handler group (`notificationPreferencesHandlers`)
- `notification-preferences.validation.ts` — Joi schemas

**Module: `src/modules/notification/`** — Core notification system
- `notification.dispatcher.ts` — Unified 3-layer dispatcher (Socket.IO + FCM + DB)

**Shared:**
- `src/shared/services/fcm.service.ts` — Firebase Admin SDK wrapper
- `src/shared/constants/collections.ts` — `DEVICE_TOKENS`, `NOTIFICATION_PREFERENCES` collections
- `src/shared/constants/messages.ts` — device token + preference messages
- `src/routes/shared.routes.ts` — mounts all notification-related endpoints

### Database

**New collection: `device_tokens`**

```javascript
{
  _id: ObjectId,
  user_id: "USR-123",          // FK to users collection
  role: "parent",              // "parent" | "driver"
  fcm_token: "cKl9x2...",     // FCM registration token
  device_type: "android",     // "android" | "ios" | "web"
  device_id: "device-uuid",   // REQUIRED - stable device identifier
  is_active: true,
  created_at: ISODate,
  updated_at: ISODate
}
```

**New collection: `notification_preferences`**

```javascript
{
  _id: ObjectId,
  user_id: "USR-123",          // FK to users collection
  push_enabled: true,          // Global on/off toggle for push notifications
  updated_at: ISODate
}
```

If no record exists for a user, push notifications are enabled by default.

**Indexes:**
```javascript
db.notification_preferences.createIndex({ user_id: 1 }, { unique: true });
```

**Multi-device support:** A user can log in on multiple devices (e.g., mom's phone + dad's phone). Each device registers with its own `device_id` and `fcm_token`, creating separate records. Notifications are sent to **all active tokens** for a user.

**Upsert logic (`upsertToken`):**
| Scenario | Match Key | Action |
|---|---|---|
| Same user + same device (token refresh) | `user_id` + `device_id` | Updates `fcm_token` on existing record |
| Same token, different user (device changed hands) | `fcm_token` | Updates user/device info on existing record |
| New device + new token | No match | Creates new record |

**Indexes (run in MongoDB shell):**
```javascript
db.device_tokens.createIndex({ user_id: 1, is_active: 1 });
db.device_tokens.createIndex({ fcm_token: 1 }, { unique: true });
db.device_tokens.createIndex({ user_id: 1, device_id: 1 });
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|---------|
| No push notifications at all | Firebase not initialized | Check server logs for `[FCM] Firebase Admin SDK initialized successfully` |
| `[FCM] Failed to initialize` | Missing/invalid service account JSON | Verify `environment/firebase-service-account.json` exists and is valid |
| Push works but no notification shown (Android) | Missing notification channel | Ensure `ping_parent_notifications` channel is created in Flutter |
| Push works but no notification shown (iOS) | Missing APNs setup | Upload APNs key in Firebase Console + enable Push Notifications capability |
| Token registered but no push | Token expired or invalid | FCM tokens expire — ensure `onTokenRefresh` re-registers |
| `POST_NOTIFICATIONS` permission denied | Android 13+ requires runtime permission | Call `FirebaseMessaging.instance.requestPermission()` |
| Notifications arrive but no navigation | Missing `onMessageOpenedApp` handler | Ensure handler is registered in `initialize()` |
| DB notifications empty | Backend not creating records | Check `notifications` collection — records should appear on pickup/drop |
| Duplicate notifications | Multiple token registrations | `device_id` is now required — upsert matches by `user_id` + `device_id` to prevent duplicates |
| Missing `device_id` error | `device_id` not sent in register request | `device_id` is required — use Android ID or iOS `identifierForVendor` |

### Debug Checklist

1. Server logs show `[FCM] Firebase Admin SDK initialized successfully`
2. After login, `device_tokens` collection has a record for the user
3. After driver action, `notifications` collection has a new record
4. After driver action, server logs show `[FCM] Multicast: 1 success, 0 failed`
5. Device receives system notification when app is in background
6. Foreground notification appears via `flutter_local_notifications`
7. Tapping notification navigates to correct screen
8. After logout, device token is deactivated (`is_active: false`)
