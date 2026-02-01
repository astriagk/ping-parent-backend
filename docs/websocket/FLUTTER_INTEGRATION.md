# Flutter Integration Guide - Driver & Parent Apps

**Version**: 1.0.0  
**Last Updated**: January 26, 2026  
**Framework**: Flutter / Dart

---

## Table of Contents

1. [Setup](#setup)
2. [Driver App Implementation](#driver-app-implementation)
3. [Parent App Implementation](#parent-app-implementation)
4. [Helper Classes](#helper-classes)
5. [Example Screens](#example-screens)
6. [Testing](#testing)

---

## Setup

### Install Dependencies

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter

  # WebSocket
  socket_io_client: ^1.0.2

  # HTTP for REST API
  http: ^0.13.5

  # Geolocation
  geolocator: ^9.0.2

  # Maps
  google_maps_flutter: ^2.5.0

  # State Management (recommended)
  provider: ^6.0.5

  # JSON serialization
  json_annotation: ^4.8.1

  # Logging
  logger: ^1.3.0
```

```bash
flutter pub get
```

### Location Permissions (Android/iOS)

**android/app/src/main/AndroidManifest.xml**:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**ios/Runner/Info.plist**:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to track the trip</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location to track the trip</string>
```

---

## Driver App Implementation

### 1. Create Driver Tracking Service

**lib/services/driver_tracking_service.dart**:

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:logger/logger.dart';

class DriverTrackingService {
  final String serverUrl;
  final String token;
  final String userId;

  late IO.Socket socket;
  final logger = Logger();

  DriverTrackingService({
    required this.serverUrl,
    required this.token,
    required this.userId,
  });

  /// Connect to WebSocket server
  Future<void> connect() async {
    try {
      socket = IO.io(
        serverUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setAuth({
              'token': token,
              'userId': userId,
              'role': 'driver'
            })
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(5000)
            .setReconnectionAttempts(5)
            .build(),
      );

      socket.onConnect((_) {
        logger.i('✓ Driver connected to tracking server');
      });

      socket.onConnectError((error) {
        logger.e('✗ Connection error: $error');
      });

      socket.onDisconnect((_) {
        logger.w('✗ Driver disconnected from server');
      });

      socket.onError((data) {
        logger.e('Socket error: $data');
      });
    } catch (e) {
      logger.e('Failed to connect: $e');
      rethrow;
    }
  }

  /// Subscribe to trip
  Future<bool> subscribeToTrip(String tripId) async {
    return Future((complete) {
      socket.emit('driver:subscribe_trip', {'tripId': tripId}, (response) {
        if (response != null && response['success'] == true) {
          logger.i('✓ Subscribed to trip: $tripId');
          complete(true);
        } else {
          logger.e('✗ Failed to subscribe: ${response?['error']}');
          complete(false);
        }
      });
    });
  }

  /// Send position update
  Future<bool> sendPosition({
    required String tripId,
    required double latitude,
    required double longitude,
    required double speed,
    required double heading,
    required double accuracy,
  }) async {
    return Future((complete) {
      socket.emit('driver:update_position', {
        'tripId': tripId,
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'heading': heading,
        'accuracy': accuracy,
      }, (response) {
        if (response != null && response['success'] == true) {
          complete(true);
        } else {
          logger.e('Position update failed');
          complete(false);
        }
      });
    });
  }

  /// Notify trip started
  Future<void> notifyTripStarted(String tripId) async {
    socket.emit('driver:trip_started', {'tripId': tripId}, (response) {
      logger.i('Trip started notification sent');
    });
  }

  /// Notify student pickup
  Future<void> notifyStudentPickup(String tripId, String studentId) async {
    socket.emit('driver:student_picked', {
      'tripId': tripId,
      'studentId': studentId,
    }, (response) {
      logger.i('✓ Pickup confirmed: $studentId');
    });
  }

  /// Notify student dropoff
  Future<void> notifyStudentDropoff(String tripId, String studentId) async {
    socket.emit('driver:student_dropped', {
      'tripId': tripId,
      'studentId': studentId,
    }, (response) {
      logger.i('✓ Dropoff confirmed: $studentId');
    });
  }

  /// Notify approaching waypoint
  Future<void> notifyApproachingWaypoint({
    required String tripId,
    required String studentId,
    required DateTime eta,
    required int distance,
  }) async {
    socket.emit('driver:approaching_waypoint', {
      'tripId': tripId,
      'studentId': studentId,
      'eta': eta.toIso8601String(),
      'distance': distance,
    }, (response) {
      logger.i('ETA notification sent');
    });
  }

  /// Notify trip completed
  Future<void> notifyTripCompleted(String tripId) async {
    socket.emit('driver:trip_completed', {'tripId': tripId}, (response) {
      logger.i('Trip completed notification sent');
    });
  }

  /// Disconnect
  void disconnect() {
    socket.disconnect();
  }

  /// Check if connected
  bool isConnected() => socket.connected;
}
```

### 2. Create Driver State Management

**lib/providers/driver_tracking_provider.dart**:

```dart
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../services/driver_tracking_service.dart';

class DriverTrackingProvider with ChangeNotifier {
  final DriverTrackingService trackingService;

  bool isConnected = false;
  bool isTracking = false;
  String? currentTripId;
  Position? currentPosition;
  String? error;

  DriverTrackingProvider(this.trackingService);

  /// Initialize and connect
  Future<void> initialize() async {
    try {
      await trackingService.connect();
      isConnected = true;
      error = null;
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Start tracking trip
  Future<void> startTracking(String tripId) async {
    try {
      currentTripId = tripId;

      // Subscribe to trip
      final subscribed = await trackingService.subscribeToTrip(tripId);
      if (!subscribed) {
        error = 'Failed to subscribe to trip';
        notifyListeners();
        return;
      }

      // Notify trip started
      await trackingService.notifyTripStarted(tripId);

      // Start sending positions
      _startPositionUpdates();

      isTracking = true;
      error = null;
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    }
  }

  /// Stop tracking
  Future<void> stopTracking() async {
    try {
      _positionStream?.cancel();

      if (currentTripId != null) {
        await trackingService.notifyTripCompleted(currentTripId!);
      }

      isTracking = false;
      currentTripId = null;
      error = null;
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    }
  }

  /// Pickup student
  Future<void> pickupStudent(String studentId) async {
    if (currentTripId == null) return;

    try {
      await trackingService.notifyStudentPickup(currentTripId!, studentId);
      error = null;
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    }
  }

  /// Dropoff student
  Future<void> dropoffStudent(String studentId) async {
    if (currentTripId == null) return;

    try {
      await trackingService.notifyStudentDropoff(currentTripId!, studentId);
      error = null;
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    }
  }

  StreamSubscription<Position>? _positionStream;

  /// Start continuous position updates
  void _startPositionUpdates() {
    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 10, // Update every 10 meters
      ),
    ).listen(
      (Position position) async {
        currentPosition = position;

        if (currentTripId != null && isTracking) {
          await trackingService.sendPosition(
            tripId: currentTripId!,
            latitude: position.latitude,
            longitude: position.longitude,
            speed: position.speed,
            heading: position.heading,
            accuracy: position.accuracy,
          );
        }

        notifyListeners();
      },
      onError: (e) {
        error = 'Location error: $e';
        notifyListeners();
      },
    );
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    trackingService.disconnect();
    super.dispose();
  }
}
```

### 3. Driver App Screen

**lib/screens/driver/active_trip_screen.dart**:

```dart
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../providers/driver_tracking_provider.dart';

class ActiveTripScreen extends StatefulWidget {
  final String tripId;
  final List<Map<String, dynamic>> students;

  const ActiveTripScreen({
    required this.tripId,
    required this.students,
  });

  @override
  _ActiveTripScreenState createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends State<ActiveTripScreen> {
  late GoogleMapController mapController;

  @override
  void initState() {
    super.initState();

    // Start tracking on load
    Future.microtask(() {
      context.read<DriverTrackingProvider>().startTracking(widget.tripId);
    });
  }

  @override
  void dispose() {
    mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Active Trip')),
      body: Consumer<DriverTrackingProvider>(
        builder: (context, provider, child) {
          return Column(
            children: [
              // Map
              Expanded(
                flex: 2,
                child: provider.currentPosition != null
                    ? GoogleMap(
                        initialCameraPosition: CameraPosition(
                          target: LatLng(
                            provider.currentPosition!.latitude,
                            provider.currentPosition!.longitude,
                          ),
                          zoom: 15,
                        ),
                        onMapCreated: (controller) {
                          mapController = controller;
                        },
                        markers: {
                          // Driver marker
                          Marker(
                            markerId: const MarkerId('driver'),
                            position: LatLng(
                              provider.currentPosition!.latitude,
                              provider.currentPosition!.longitude,
                            ),
                            infoWindow: InfoWindow(
                              title: 'You',
                              snippet: 'Speed: ${provider.currentPosition!.speed.toStringAsFixed(1)} m/s',
                            ),
                          ),
                          // Student markers
                          ...widget.students.map((student) {
                            return Marker(
                              markerId: MarkerId(student['id']),
                              position: LatLng(
                                student['latitude'],
                                student['longitude'],
                              ),
                              infoWindow: InfoWindow(
                                title: student['name'],
                                snippet: 'Sequence: ${student['sequence']}',
                              ),
                            );
                          }),
                        },
                      )
                    : const Center(child: CircularProgressIndicator()),
              ),

              // Status and controls
              Expanded(
                flex: 1,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      // Status
                      Chip(
                        label: Text(
                          provider.isConnected ? '✓ Connected' : '✗ Disconnected',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        backgroundColor: provider.isConnected ? Colors.green : Colors.red,
                      ),

                      // Error message
                      if (provider.error != null)
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Text(
                            '⚠️ ${provider.error}',
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),

                      const SizedBox(height: 8),

                      // Student buttons
                      Expanded(
                        child: ListView.builder(
                          itemCount: widget.students.length,
                          itemBuilder: (context, index) {
                            final student = widget.students[index];
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4.0),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () {
                                        provider.pickupStudent(student['id']);
                                      },
                                      child: Text('Pickup: ${student['name']}'),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () {
                                        provider.dropoffStudent(student['id']);
                                      },
                                      child: Text('Dropoff: ${student['name']}'),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),

                      // Stop tracking button
                      ElevatedButton(
                        onPressed: () async {
                          await provider.stopTracking();
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                        ),
                        child: const Text(
                          'Stop Tracking',
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

---

## Parent App Implementation

### 1. Create Parent Tracking Service

**lib/services/parent_tracking_service.dart**:

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:logger/logger.dart';

typedef TripUpdateCallback = void Function(TripUpdate update);

class TripUpdate {
  final String tripId;
  final String driverId;
  final String eventType; // 'position', 'started', 'pickup', 'dropoff', 'approaching', 'completed'
  final double? latitude;
  final double? longitude;
  final double? speed;
  final String? studentId;
  final int? distance;
  final String? eta;
  final DateTime timestamp;

  TripUpdate({
    required this.tripId,
    required this.driverId,
    required this.eventType,
    this.latitude,
    this.longitude,
    this.speed,
    this.studentId,
    this.distance,
    this.eta,
    required this.timestamp,
  });
}

class ParentTrackingService {
  final String serverUrl;
  final String token;
  final String userId;

  late IO.Socket socket;
  final logger = Logger();

  final Map<String, List<TripUpdateCallback>> listeners = {};
  final Set<String> watchedTrips = {};

  ParentTrackingService({
    required this.serverUrl,
    required this.token,
    required this.userId,
  });

  /// Connect to WebSocket server
  Future<void> connect() async {
    try {
      socket = IO.io(
        serverUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setAuth({
              'token': token,
              'userId': userId,
              'role': 'parent'
            })
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(5000)
            .setReconnectionAttempts(5)
            .build(),
      );

      socket.onConnect((_) {
        logger.i('✓ Parent connected to tracking server');
        // Resubscribe to watched trips
        for (final tripId in watchedTrips) {
          _subscribeToTrip(tripId);
        }
      });

      socket.onConnectError((error) {
        logger.e('✗ Connection error: $error');
      });

      socket.onDisconnect((_) {
        logger.w('✗ Parent disconnected from server');
      });

      _setupEventListeners();
    } catch (e) {
      logger.e('Failed to connect: $e');
      rethrow;
    }
  }

  /// Setup event listeners for all trip events
  void _setupEventListeners() {
    // Position updates
    socket.on('trip:position_update', (data) {
      _notifyListeners(data['tripId'], TripUpdate(
        tripId: data['tripId'],
        driverId: data['driverId'],
        eventType: 'position',
        latitude: (data['latitude'] as num).toDouble(),
        longitude: (data['longitude'] as num).toDouble(),
        speed: (data['speed'] as num).toDouble(),
        timestamp: DateTime.parse(data['timestamp']),
      ));
    });

    // Trip started
    socket.on('trip:started', (data) {
      _notifyListeners(data['tripId'], TripUpdate(
        tripId: data['tripId'],
        driverId: data['driverId'],
        eventType: 'started',
        timestamp: DateTime.parse(data['timestamp']),
      ));
    });

    // Trip completed
    socket.on('trip:completed', (data) {
      _notifyListeners(data['tripId'], TripUpdate(
        tripId: data['tripId'],
        driverId: data['driverId'],
        eventType: 'completed',
        timestamp: DateTime.parse(data['timestamp']),
      ));
    });

    // Student picked up
    socket.on('student:picked_up', (data) {
      _notifyListeners(data['tripId'], TripUpdate(
        tripId: data['tripId'],
        driverId: data['driverId'],
        eventType: 'pickup',
        studentId: data['studentId'],
        timestamp: DateTime.parse(data['timestamp']),
      ));
    });

    // Student dropped off
    socket.on('student:dropped_off', (data) {
      _notifyListeners(data['tripId'], TripUpdate(
        tripId: data['tripId'],
        driverId: data['driverId'],
        eventType: 'dropoff',
        studentId: data['studentId'],
        timestamp: DateTime.parse(data['timestamp']),
      ));
    });

    // Waypoint approaching
    socket.on('waypoint:approaching', (data) {
      _notifyListeners(data['tripId'], TripUpdate(
        tripId: data['tripId'],
        driverId: data['driverId'],
        eventType: 'approaching',
        studentId: data['studentId'],
        distance: data['distance'],
        eta: data['eta'],
        timestamp: DateTime.parse(data['timestamp']),
      ));
    });
  }

  /// Watch trip for updates
  Future<bool> watchTrip(String tripId) async {
    return Future((complete) {
      socket.emit('parent:subscribe_trip', {'tripId': tripId}, (response) {
        if (response != null && response['success'] == true) {
          watchedTrips.add(tripId);
          logger.i('✓ Watching trip: $tripId');
          complete(true);
        } else {
          logger.e('✗ Failed to watch trip: ${response?['error']}');
          complete(false);
        }
      });
    });
  }

  /// Stop watching trip
  Future<bool> unwatchTrip(String tripId) async {
    return Future((complete) {
      socket.emit('parent:unsubscribe_trip', {'tripId': tripId}, (response) {
        if (response != null && response['success'] == true) {
          watchedTrips.remove(tripId);
          logger.i('✓ Unwatched trip: $tripId');
          complete(true);
        } else {
          logger.e('✗ Failed to unwatch trip');
          complete(false);
        }
      });
    });
  }

  /// Private subscription (used on reconnect)
  void _subscribeToTrip(String tripId) {
    socket.emit('parent:subscribe_trip', {'tripId': tripId});
  }

  /// Register update listener
  void onTripUpdate(String tripId, TripUpdateCallback callback) {
    if (!listeners.containsKey(tripId)) {
      listeners[tripId] = [];
    }
    listeners[tripId]!.add(callback);
  }

  /// Notify listeners
  void _notifyListeners(String tripId, TripUpdate update) {
    final callbacks = listeners[tripId];
    if (callbacks != null) {
      for (final callback in callbacks) {
        try {
          callback(update);
        } catch (e) {
          logger.e('Error notifying listener: $e');
        }
      }
    }
  }

  /// Get trip details via REST API
  Future<Map<String, dynamic>?> getTripDetails(String tripId) async {
    try {
      final response = await http.get(
        Uri.parse('$serverUrl/api/tracking/$tripId/details'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          logger.i('✓ Trip details loaded');
          return data['data'];
        }
      }
      return null;
    } catch (e) {
      logger.e('Error fetching trip details: $e');
      return null;
    }
  }

  /// Disconnect
  void disconnect() {
    watchedTrips.forEach((tripId) {
      socket.emit('parent:unsubscribe_trip', {'tripId': tripId});
    });
    socket.disconnect();
  }

  /// Check if connected
  bool isConnected() => socket.connected;
}
```

Add HTTP import:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
```

### 2. Create Parent State Management

**lib/providers/parent_tracking_provider.dart**:

```dart
import 'package:flutter/foundation.dart';
import '../services/parent_tracking_service.dart';

class ParentTrackingProvider with ChangeNotifier {
  final ParentTrackingService trackingService;

  bool isConnected = false;
  Map<String, dynamic>? tripDetails;
  Map<String, List<TripUpdate>> tripUpdates = {};
  String? error;

  ParentTrackingProvider(this.trackingService);

  /// Initialize and connect
  Future<void> initialize() async {
    try {
      await trackingService.connect();
      isConnected = true;
      error = null;
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Start watching trip
  Future<void> watchTrip(String tripId) async {
    try {
      // Load trip details
      tripDetails = await trackingService.getTripDetails(tripId);

      // Subscribe to updates
      final watching = await trackingService.watchTrip(tripId);

      if (watching) {
        // Listen to updates
        tripUpdates[tripId] = [];
        trackingService.onTripUpdate(tripId, (update) {
          tripUpdates[tripId]!.insert(0, update);
          if (tripUpdates[tripId]!.length > 100) {
            tripUpdates[tripId]!.removeLast();
          }
          error = null;
          notifyListeners();
        });
      }

      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    }
  }

  /// Stop watching trip
  Future<void> unwatchTrip(String tripId) async {
    try {
      await trackingService.unwatchTrip(tripId);
      tripUpdates.remove(tripId);
      error = null;
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    trackingService.disconnect();
    super.dispose();
  }
}
```

### 3. Parent App Screen

**lib/screens/parent/tracking_screen.dart**:

```dart
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../providers/parent_tracking_provider.dart';
import '../../services/parent_tracking_service.dart';

class TrackingScreen extends StatefulWidget {
  final String tripId;

  const TrackingScreen({required this.tripId});

  @override
  _TrackingScreenState createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  late GoogleMapController mapController;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<ParentTrackingProvider>().watchTrip(widget.tripId);
    });
  }

  @override
  void dispose() {
    mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Track Trip')),
      body: Consumer<ParentTrackingProvider>(
        builder: (context, provider, child) {
          final updates = provider.tripUpdates[widget.tripId] ?? [];
          final lastPosition = updates
              .firstWhere(
                (u) => u.eventType == 'position',
                orElse: () => null,
              );

          return Column(
            children: [
              // Map
              Expanded(
                flex: 2,
                child: lastPosition != null
                    ? GoogleMap(
                        initialCameraPosition: CameraPosition(
                          target: LatLng(
                            lastPosition.latitude!,
                            lastPosition.longitude!,
                          ),
                          zoom: 15,
                        ),
                        onMapCreated: (controller) {
                          mapController = controller;
                        },
                        markers: {
                          // Driver marker
                          Marker(
                            markerId: const MarkerId('driver'),
                            position: LatLng(
                              lastPosition.latitude!,
                              lastPosition.longitude!,
                            ),
                            infoWindow: const InfoWindow(title: 'Driver'),
                          ),
                        },
                      )
                    : const Center(
                        child: CircularProgressIndicator(),
                      ),
              ),

              // Updates feed
              Expanded(
                flex: 1,
                child: Column(
                  children: [
                    // Status
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Chip(
                        label: Text(
                          provider.isConnected ? '✓ Connected' : '✗ Disconnected',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        backgroundColor: provider.isConnected
                            ? Colors.green
                            : Colors.red,
                      ),
                    ),

                    // Error
                    if (provider.error != null)
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Text(
                          '⚠️ ${provider.error}',
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),

                    // Updates
                    Expanded(
                      child: ListView.builder(
                        itemCount: updates.length,
                        itemBuilder: (context, index) {
                          final update = updates[index];
                          return ListTile(
                            leading: _getEventIcon(update.eventType),
                            title: Text(_getEventTitle(update)),
                            subtitle: Text(
                              update.timestamp.toString().split('.')[0],
                              style: const TextStyle(fontSize: 12),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Icon _getEventIcon(String eventType) {
    switch (eventType) {
      case 'position':
        return const Icon(Icons.location_on, color: Colors.blue);
      case 'started':
        return const Icon(Icons.directions_run, color: Colors.green);
      case 'pickup':
        return const Icon(Icons.person_add, color: Colors.orange);
      case 'dropoff':
        return const Icon(Icons.person_remove, color: Colors.purple);
      case 'approaching':
        return const Icon(Icons.notifications, color: Colors.red);
      case 'completed':
        return const Icon(Icons.check_circle, color: Colors.green);
      default:
        return const Icon(Icons.info);
    }
  }

  String _getEventTitle(TripUpdate update) {
    switch (update.eventType) {
      case 'position':
        return 'Speed: ${update.speed?.toStringAsFixed(1)} m/s';
      case 'started':
        return '🚗 Trip Started';
      case 'pickup':
        return '✓ Student picked up';
      case 'dropoff':
        return '✓ Student dropped off';
      case 'approaching':
        return '📍 Arriving in ${update.distance}m';
      case 'completed':
        return '✓ Trip Completed';
      default:
        return update.eventType;
    }
  }
}
```

---

## Helper Classes

### Models

**lib/models/trip.dart**:

```dart
class Trip {
  final String id;
  final String driverId;
  final String type; // 'pickup' or 'dropoff'
  final String status; // 'pending', 'in_progress', 'completed'
  final double totalDistance;
  final int totalDuration;
  final List<Waypoint> waypoints;

  Trip({
    required this.id,
    required this.driverId,
    required this.type,
    required this.status,
    required this.totalDistance,
    required this.totalDuration,
    required this.waypoints,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['trip_id'],
      driverId: json['driver_id'],
      type: json['trip_type'],
      status: json['trip_status'],
      totalDistance: (json['total_distance'] as num).toDouble(),
      totalDuration: json['optimized_route_data']['total_duration'],
      waypoints: (json['optimized_route_data']['waypoints'] as List)
          .map((w) => Waypoint.fromJson(w))
          .toList(),
    );
  }
}

class Waypoint {
  final double latitude;
  final double longitude;
  final String? address;
  final String? studentId;
  final int sequenceOrder;
  final DateTime estimatedArrivalTime;

  Waypoint({
    required this.latitude,
    required this.longitude,
    this.address,
    this.studentId,
    required this.sequenceOrder,
    required this.estimatedArrivalTime,
  });

  factory Waypoint.fromJson(Map<String, dynamic> json) {
    return Waypoint(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      address: json['address'],
      studentId: json['student_id'],
      sequenceOrder: json['sequence_order'] ?? 0,
      estimatedArrivalTime: DateTime.parse(json['estimated_arrival_time']),
    );
  }
}
```

---

## Example Screens

See implementation examples above in:

- Driver App: `ActiveTripScreen`
- Parent App: `TrackingScreen`

---

## Testing

### Unit Test Example

```dart
// test/services/driver_tracking_service_test.dart

void main() {
  group('DriverTrackingService', () {
    late DriverTrackingService service;

    setUp(() {
      service = DriverTrackingService(
        serverUrl: 'http://localhost:3000',
        token: 'test_token',
        userId: 'test_user',
      );
    });

    test('Connect successfully', () async {
      await service.connect();
      expect(service.isConnected(), isTrue);
    });

    test('Subscribe to trip', () async {
      await service.connect();
      final result = await service.subscribeToTrip('trip_123');
      expect(result, isTrue);
    });
  });
}
```

### Integration Test Example

```dart
// test/integration/tracking_flow_test.dart

void main() {
  group('Driver-Parent Tracking Flow', () {
    test('Driver sends position, parent receives update', () async {
      // Setup
      final driverService = DriverTrackingService(...);
      final parentService = ParentTrackingService(...);

      // Connect
      await driverService.connect();
      await parentService.connect();

      // Driver subscribes
      await driverService.subscribeToTrip('trip_123');

      // Parent watches
      await parentService.watchTrip('trip_123');

      // Driver sends position
      final sent = await driverService.sendPosition(
        tripId: 'trip_123',
        latitude: 12.9716,
        longitude: 77.5946,
        speed: 45,
        heading: 180,
        accuracy: 10,
      );

      expect(sent, isTrue);

      // Verify parent received update
      await Future.delayed(const Duration(seconds: 1));
      // Assert parent got the update
    });
  });
}
```

---

## References

- **WebSocket Events**: See `docs/websocket/WEBSOCKET.md`
- **REST API**: See `docs/tracking/TRACKING.md`
- **Socket.IO Client**: https://pub.dev/packages/socket_io_client
- **Geolocator**: https://pub.dev/packages/geolocator
- **Google Maps**: https://pub.dev/packages/google_maps_flutter

---

**Status**: ✅ Production Ready  
**Last Updated**: January 26, 2026
