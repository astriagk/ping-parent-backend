# Razorpay Frontend Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup](#setup)
4. [Frontend Payment Flow](#frontend-payment-flow)
5. [Implementation Guide](#implementation-guide)
6. [Testing](#testing)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide explains what the **frontend** (React/Vue/Angular app) needs to do for Razorpay payment integration.

### Payment Flow Diagram

```
┌─────────────┐
│  Parent     │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Get Razorpay Key ID
       ▼
┌─────────────────────────────────┐
│ Call: GET /api/razorpay/config  │
│ Response: { keyId: "rzp_..." }  │
└──────┬──────────────────────────┘
       │
       │ 2. Get subscription amount
       │ 3. Create order on backend
       ▼
┌─────────────────────────────────────────┐
│ Call: POST /api/razorpay/orders         │
│ Body: { amount, subscription_id, ... }  │
│ Response: { id: "order_..." }           │
└──────┬──────────────────────────────────┘
       │
       │ 4. Open Razorpay Checkout
       │ 5. User enters card details
       │ 6. User completes payment
       ▼
┌──────────────────────────────┐
│ Razorpay Payment Gateway     │
│ Returns payment response:    │
│ - razorpay_order_id          │
│ - razorpay_payment_id        │
│ - razorpay_signature         │
└──────┬───────────────────────┘
       │
       │ 7. Verify payment on backend
       ▼
┌─────────────────────────────────────────┐
│ Call: POST /api/razorpay/verify         │
│ Body: {                                 │
│   razorpay_order_id,                   │
│   razorpay_payment_id,                 │
│   razorpay_signature,                  │
│   payment_id                           │
│ }                                      │
│ Response: { success: true, ... }       │
└──────┬───────────────────────────────────┘
       │
       │ 8. Handle response
       ├─ If success: Show confirmation
       │              Redirect to dashboard
       │
       └─ If failed: Show error message
                    Ask to retry
```

---

## Prerequisites

### Frontend Stack

This guide covers **multiple frameworks**:

- ✅ React / Vue / Angular (Web)
- ✅ Flutter (Mobile iOS/Android)
- ✅ Vanilla JavaScript

### Required Libraries

**For React/Web:**

```bash
npm install axios
# or
npm install fetch-api
```

**For Flutter:**

```bash
flutter pub add razorpay_flutter
flutter pub add http
```

### Backend Endpoints Ready

Ensure these endpoints are available:

- ✅ `GET /api/razorpay/config` - Get Razorpay Key ID
- ✅ `POST /api/razorpay/orders` - Create order
- ✅ `POST /api/razorpay/verify` - Verify payment

### Authentication

Frontend must have JWT token from login for these endpoints (except config).

---

## Setup

### Step 1: Install Razorpay Script

Add Razorpay to your HTML or load dynamically:

**Option A: Add to HTML (index.html)**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Ping Parent</title>
    <!-- Other scripts -->
  </head>
  <body>
    <div id="root"></div>

    <!-- Add Razorpay script -->
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

    <script src="/src/index.js"></script>
  </body>
</html>
```

**Option B: Load Dynamically in React**

```typescript
// Add to your payment component or context
export const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};
```

### Step 2: Set Up API Configuration

Create an API service file:

**services/razorpayService.ts**

```typescript
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Initialize axios with auth token
const getAuthHeader = () => {
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const razorpayService = {
  /**
   * Get Razorpay configuration (Key ID)
   */
  async getConfig() {
    try {
      const response = await axios.get(`${API_BASE_URL}/razorpay/config`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to get Razorpay config:", error);
      throw error;
    }
  },

  /**
   * Create a new Razorpay order
   */
  async createOrder(orderData: {
    amount: number; // Amount in rupees
    currency?: string;
    subscription_id?: string;
    description?: string;
  }) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/razorpay/orders`,
        orderData,
        {
          headers: getAuthHeader(),
        },
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to create order:", error);
      throw error;
    }
  },

  /**
   * Verify payment after checkout
   */
  async verifyPayment(verificationData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    payment_id: string; // Your internal payment ID
  }) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/razorpay/verify`,
        verificationData,
        {
          headers: getAuthHeader(),
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to verify payment:", error);
      throw error;
    }
  },
};
```

### Step 3: Create Environment Variables

**Development (.env)**

```env
REACT_APP_API_URL=http://localhost:3000/api
```

**Production (.env.production)**

```env
REACT_APP_API_URL=https://yourdomain.com/api
```

---

## Flutter Setup

### Step 1: Add Dependencies

Add to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  razorpay_flutter: ^1.3.0
  http: ^1.1.0
  dio: ^5.3.0 # For HTTP requests (alternative to http)
```

Then run:

```bash
flutter pub get
```

### Step 2: Android Setup

**android/app/build.gradle:**

```gradle
android {
    compileSdkVersion 33  // or higher

    defaultConfig {
        minSdkVersion 21
    }
}
```

### Step 3: iOS Setup

**ios/Podfile:**

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    target.build_configurations.each do |config|
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= [
        '$(inherited)',
        'RAZORPAY_ENABLED=1',
      ]
    end
  end
end
```

Run:

```bash
cd ios
pod install
cd ..
```

### Step 4: Create API Configuration Service

**lib/services/razorpay_service.dart:**

```dart
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'dart:convert';

class RazorpayService {
  final String baseUrl;
  final String? authToken;

  RazorpayService({
    required this.baseUrl,
    this.authToken,
  });

  /// Get Razorpay configuration (Key ID)
  Future<Map<String, dynamic>> getConfig() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/razorpay/config'),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        throw Exception('Failed to get Razorpay config: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error getting config: $e');
      throw Exception('Failed to get Razorpay config: $e');
    }
  }

  /// Create a new Razorpay order
  Future<Map<String, dynamic>> createOrder({
    required double amount,
    String? subscriptionId,
    String? description,
    String currency = 'INR',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/razorpay/orders'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'amount': amount,
          'currency': currency,
          'subscription_id': subscriptionId,
          'description': description,
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        throw Exception('Failed to create order: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error creating order: $e');
      throw Exception('Failed to create order: $e');
    }
  }

  /// Verify payment after checkout
  Future<Map<String, dynamic>> verifyPayment({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
    required String paymentId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/razorpay/verify'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'razorpay_order_id': razorpayOrderId,
          'razorpay_payment_id': razorpayPaymentId,
          'razorpay_signature': razorpaySignature,
          'payment_id': paymentId,
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data;
      } else {
        throw Exception('Failed to verify payment: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error verifying payment: $e');
      throw Exception('Failed to verify payment: $e');
    }
  }
}
```

### Step 5: Create Flutter Payment Widget

**lib/screens/payment_checkout.dart:**

```dart
import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../services/razorpay_service.dart';

class PaymentCheckout extends StatefulWidget {
  final String subscriptionId;
  final String subscriptionName;
  final double amount; // Amount in rupees
  final String paymentId; // Your internal payment ID
  final String apiBaseUrl;
  final String authToken;

  const PaymentCheckout({
    Key? key,
    required this.subscriptionId,
    required this.subscriptionName,
    required this.amount,
    required this.paymentId,
    required this.apiBaseUrl,
    required this.authToken,
  }) : super(key: key);

  @override
  State<PaymentCheckout> createState() => _PaymentCheckoutState();
}

class _PaymentCheckoutState extends State<PaymentCheckout> {
  late Razorpay _razorpay;
  late RazorpayService _razorpayService;
  bool _isLoading = false;
  String? _error;
  String? _keyId;

  @override
  void initState() {
    super.initState();
    _razorpayService = RazorpayService(
      baseUrl: widget.apiBaseUrl,
      authToken: widget.authToken,
    );

    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);

    _loadConfiguration();
  }

  /// Load Razorpay configuration
  Future<void> _loadConfiguration() async {
    try {
      setState(() => _isLoading = true);
      final config = await _razorpayService.getConfig();
      setState(() {
        _keyId = config['keyId'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load payment system: $e';
        _isLoading = false;
      });
      debugPrint('Error loading config: $e');
    }
  }

  /// Handle payment button click
  Future<void> _handlePaymentClick() async {
    if (_keyId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment system not ready. Please wait.')),
      );
      return;
    }

    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Step 1: Create order on backend
      final order = await _razorpayService.createOrder(
        amount: widget.amount,
        subscriptionId: widget.subscriptionId,
        description: widget.subscriptionName,
      );

      if (order['id'] == null) {
        throw Exception('Failed to create order');
      }

      // Step 2: Open Razorpay checkout
      _openRazorpayCheckout(order['id']);
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
      debugPrint('Error initiating payment: $e');
    }
  }

  /// Open Razorpay checkout modal
  void _openRazorpayCheckout(String orderId) {
    try {
      var options = {
        'key': _keyId,
        'amount': (widget.amount * 100).toInt(), // Amount in paise
        'name': 'Ping Parent',
        'description': widget.subscriptionName,
        'order_id': orderId,
        'prefill': {
          'contact': '', // Add phone if available
          'email': '', // Add email if available
        },
        'theme': {
          'color': '#3399cc',
        },
      };

      _razorpay.open(options);
    } catch (e) {
      setState(() => _error = 'Failed to open checkout: $e');
      debugPrint('Error opening checkout: $e');
      setState(() => _isLoading = false);
    }
  }

  /// Handle successful payment
  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      // Verify payment on backend
      final result = await _razorpayService.verifyPayment(
        razorpayOrderId: response.orderId ?? '',
        razorpayPaymentId: response.paymentId ?? '',
        razorpaySignature: response.signature ?? '',
        paymentId: widget.paymentId,
      );

      if (result['success'] == true) {
        _handlePaymentComplete(result['data']);
      } else {
        _handlePaymentError(
          PaymentFailureResponse(
            code: 'VERIFICATION_FAILED',
            message: result['error'] ?? 'Payment verification failed',
            error: result['error'],
          ),
        );
      }
    } catch (e) {
      _handlePaymentError(
        PaymentFailureResponse(
          code: 'VERIFICATION_ERROR',
          message: 'Payment verification failed: $e',
          error: e.toString(),
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  /// Handle payment error
  void _handlePaymentError(PaymentFailureResponse response) {
    setState(() {
      _error = 'Payment failed: ${response.message}';
      _isLoading = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Payment failed: ${response.message}'),
        backgroundColor: Colors.red,
      ),
    );

    debugPrint('Payment error: ${response.code} - ${response.message}');
  }

  /// Handle external wallet
  void _handleExternalWallet(ExternalWalletResponse response) {
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('External wallet: ${response.walletName}')),
    );
  }

  /// Handle successful payment completion
  void _handlePaymentComplete(dynamic paymentData) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payment successful! Your subscription is now active.'),
        backgroundColor: Colors.green,
      ),
    );

    // Navigate to dashboard
    Navigator.of(context).pushReplacementNamed('/dashboard');
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscribe'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Title
            Text(
              'Subscribe to ${widget.subscriptionName}',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),

            // Amount Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text(
                      'Amount to Pay',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '₹${widget.amount.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Error Message
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade100,
                  border: Border.all(color: Colors.red),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Text(
                      _error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () {
                        setState(() => _error = null);
                      },
                      child: const Text('Dismiss'),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 24),

            // Pay Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: (_isLoading || _keyId == null)
                    ? null
                    : _handlePaymentClick,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  disabledBackgroundColor: Colors.grey,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : const Text(
                        'Pay Now',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),

            // Loading Message
            if (_keyId == null && !_isLoading)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: const Text(
                  'Loading payment system...',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
```

### Step 6: Usage in Flutter App

**lib/main.dart:**

```dart
import 'package:flutter/material.dart';
import 'screens/payment_checkout.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ping Parent',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ping Parent')),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => PaymentCheckout(
                  subscriptionId: 'sub_123',
                  subscriptionName: 'Monthly Subscription',
                  amount: 500, // ₹500
                  paymentId: '507f1f77bcf86cd799439011',
                  apiBaseUrl: 'http://localhost:3000/api', // Update for production
                  authToken: 'YOUR_JWT_TOKEN', // Get from your auth service
                ),
              ),
            );
          },
          child: const Text('Subscribe Now'),
        ),
      ),
    );
  }
}
```

### Step 7: Environment Configuration for Flutter

**lib/config/constants.dart:**

```dart
class AppConstants {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );

  static const String appName = 'Ping Parent';
  static const String razorpayThemeColor = '#3399cc';
}
```

Build with environment variables:

```bash
# Development
flutter run --dart-define=API_BASE_URL=http://localhost:3000/api

# Production
flutter run --dart-define=API_BASE_URL=https://yourdomain.com/api
```

### Step 8: Get Auth Token in Flutter

**lib/services/auth_service.dart:**

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _authTokenKey = 'auth_token';

  static Future<String?> getAuthToken() async {
    return await _storage.read(key: _authTokenKey);
  }

  static Future<void> saveAuthToken(String token) async {
    await _storage.write(key: _authTokenKey, value: token);
  }

  static Future<void> clearAuthToken() async {
    await _storage.delete(key: _authTokenKey);
  }
}
```

---

## Frontend Payment Flow

### Complete Payment Component Example

**components/PaymentCheckout.tsx**

```typescript
import React, { useState, useEffect } from "react";
import { razorpayService } from "../services/razorpayService";
import { loadRazorpayScript } from "../utils/razorpay";

interface PaymentCheckoutProps {
  subscriptionId: string;
  subscriptionName: string;
  amount: number; // Amount in rupees
  paymentId: string; // Your internal payment ID
}

export const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  subscriptionId,
  subscriptionName,
  amount,
  paymentId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyId, setKeyId] = useState<string | null>(null);

  // Step 1: Load Razorpay script and get Key ID on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load Razorpay script
        await loadRazorpayScript();

        // Get Key ID from backend
        const config = await razorpayService.getConfig();
        setKeyId(config.keyId);
      } catch (err) {
        setError("Failed to initialize payment system");
        console.error(err);
      }
    };

    initialize();
  }, []);

  // Step 2: Handle payment button click
  const handlePaymentClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 2a: Create order on backend
      const order = await razorpayService.createOrder({
        amount,
        currency: "INR",
        subscription_id: subscriptionId,
        description: subscriptionName,
      });

      if (!order || !order.id) {
        throw new Error("Failed to create order");
      }

      // Step 2b: Open Razorpay checkout
      openRazorpayCheckout(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
      console.error(err);
      setIsLoading(false);
    }
  };

  // Step 3: Open Razorpay checkout modal
  const openRazorpayCheckout = (orderId: string) => {
    // Get Razorpay instance from window
    const Razorpay = (window as any).Razorpay;

    if (!Razorpay) {
      setError("Razorpay is not loaded");
      setIsLoading(false);
      return;
    }

    const options = {
      key: keyId, // Your Key ID
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      name: "Ping Parent",
      description: subscriptionName,
      order_id: orderId, // The order ID from backend
      handler: handlePaymentSuccess, // Called after successful payment
      prefill: {
        // Pre-fill user email if available
        email: localStorage.getItem("userEmail") || "",
        contact: localStorage.getItem("userPhone") || "",
      },
      theme: {
        color: "#3399cc", // Your brand color
      },
      // Optional: Hide certain payment methods
      // method: {
      //   netbanking: true,
      //   card: true,
      //   upi: true,
      //   wallet: true,
      // },
    };

    const rzp = new Razorpay(options);

    // Handle payment failure in checkout
    rzp.on("payment.failed", (response: any) => {
      handlePaymentError({
        code: response.error.code,
        description: response.error.description,
        source: response.error.source,
        step: response.error.step,
        reason: response.error.reason,
      });
    });

    // Open checkout
    rzp.open();
  };

  // Step 4: Handle successful payment
  const handlePaymentSuccess = async (response: any) => {
    try {
      // Step 4a: Verify payment on backend
      const verificationResult = await razorpayService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        payment_id: paymentId, // Your internal payment ID
      });

      if (verificationResult.success) {
        // Step 4b: Payment verified successfully
        handlePaymentComplete(verificationResult.data);
      } else {
        // Payment verification failed
        throw new Error(verificationResult.error || "Payment verification failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment verification failed");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5: Handle payment errors
  const handlePaymentError = (errorDetails: any) => {
    const errorMessage = `Payment failed: ${errorDetails.description}`;
    setError(errorMessage);
    setIsLoading(false);
    console.error("Payment error:", errorDetails);
  };

  // Step 6: Handle successful payment completion
  const handlePaymentComplete = (paymentData: any) => {
    console.log("Payment completed:", paymentData);

    // Show success message
    alert("Payment successful! Your subscription is now active.");

    // Redirect to dashboard or update UI
    window.location.href = "/dashboard";
    // Or use router: navigate("/dashboard");
  };

  return (
    <div className="payment-checkout">
      <h2>Subscribe to {subscriptionName}</h2>
      <p>Amount: ₹{amount}</p>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <button
        onClick={handlePaymentClick}
        disabled={isLoading || !keyId}
        className="payment-button"
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </button>

      {!keyId && <p>Loading payment system...</p>}
    </div>
  );
};
```

---

## Implementation Guide

### Using with React Context (Optional)

For state management, create a payment context:

**context/PaymentContext.tsx**

```typescript
import React, { createContext, useContext, useState } from "react";

interface PaymentContextType {
  isProcessing: boolean;
  error: string | null;
  processPayment: (orderId: string, amount: number) => Promise<void>;
  clearError: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (orderId: string, amount: number) => {
    setIsProcessing(true);
    setError(null);

    try {
      const Razorpay = (window as any).Razorpay;

      const options = {
        key: localStorage.getItem("razorpayKeyId"),
        amount: Math.round(amount * 100),
        currency: "INR",
        order_id: orderId,
        handler: async (response: any) => {
          // Handle success
          setIsProcessing(false);
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        isProcessing,
        error,
        processPayment,
        clearError: () => setError(null),
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
};
```

### Using with Redux (Optional)

For Redux integration, create actions and reducers:

**redux/paymentSlice.ts**

```typescript
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { razorpayService } from "../services/razorpayService";

export const fetchRazorpayConfig = createAsyncThunk(
  "payment/fetchConfig",
  async () => {
    return await razorpayService.getConfig();
  },
);

export const createPaymentOrder = createAsyncThunk(
  "payment/createOrder",
  async (orderData: any) => {
    return await razorpayService.createOrder(orderData);
  },
);

export const verifyPayment = createAsyncThunk(
  "payment/verifyPayment",
  async (verificationData: any) => {
    return await razorpayService.verifyPayment(verificationData);
  },
);

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    keyId: null,
    isLoading: false,
    error: null,
    order: null,
  },
  extraReducers: (builder) => {
    // Handle fetch config
    builder.addCase(fetchRazorpayConfig.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchRazorpayConfig.fulfilled, (state, action) => {
      state.keyId = action.payload.keyId;
      state.isLoading = false;
    });
    builder.addCase(fetchRazorpayConfig.rejected, (state, action) => {
      state.error = action.error.message;
      state.isLoading = false;
    });

    // Handle create order
    builder.addCase(createPaymentOrder.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(createPaymentOrder.fulfilled, (state, action) => {
      state.order = action.payload;
      state.isLoading = false;
    });
    builder.addCase(createPaymentOrder.rejected, (state, action) => {
      state.error = action.error.message;
      state.isLoading = false;
    });
  },
});

export default paymentSlice.reducer;
```

---

## Testing

### Test Credentials from Backend Guide

#### Test Credit Cards

Use these for testing without real charges:

| Card Type           | Number              | Expiry | CVV  |
| ------------------- | ------------------- | ------ | ---- |
| **Visa Success**    | 4111 1111 1111 1111 | 12/25  | 123  |
| **Mastercard**      | 5555 5555 5555 4444 | 12/25  | 123  |
| **Visa (Declined)** | 4000 0000 0000 0002 | 12/25  | 123  |
| **Amex**            | 3782 822463 10005   | 12/25  | 1234 |

#### Test UPI IDs

| UPI ID             | Result              |
| ------------------ | ------------------- |
| `success@razorpay` | ✅ Payment succeeds |
| `failure@razorpay` | ❌ Payment fails    |

### Manual Testing Steps

1. **Start your frontend application**

   ```bash
   npm start
   ```

2. **Navigate to payment page**

3. **Click "Pay Now" button**

4. **Select payment method**
   - For card: Click "Card"
   - For UPI: Click "UPI"

5. **Enter test credentials**
   - Card: Use test card number above
   - Any future expiry date (e.g., 12/25)
   - Any 3-4 digit CVV

6. **Complete payment**
   - If prompted for OTP: Enter `123456`
   - Payment should succeed

7. **Verify in browser console**
   - Should see success message
   - Should be redirected to dashboard

### Testing in Different Environments

**Development**

```env
REACT_APP_API_URL=http://localhost:3000/api
```

**Staging**

```env
REACT_APP_API_URL=https://staging.yourdomain.com/api
```

**Production**

```env
REACT_APP_API_URL=https://yourdomain.com/api
```

---

## Error Handling

### Common Frontend Errors

#### Error: "Razorpay is not loaded"

**Cause:** Script not loaded before using

**Solution:**

```typescript
// Ensure script is loaded
await loadRazorpayScript();
// Then use Razorpay
```

#### Error: "Network error when creating order"

**Cause:** Backend not reachable or API error

**Solution:**

```typescript
try {
  const order = await razorpayService.createOrder(data);
} catch (error) {
  console.error("Network error:", error);
  // Show user-friendly message
}
```

#### Error: "Invalid Key ID"

**Cause:** KeyId not loaded or incorrect

**Solution:**

```typescript
// Verify keyId is loaded
console.log("Key ID:", keyId);
// Make sure config endpoint is called
const config = await razorpayService.getConfig();
```

#### Error: "Payment verification failed"

**Cause:** Invalid signature or payment not found

**Solution:**

```typescript
// Ensure all fields are correct
const verificationData = {
  razorpay_order_id: response.razorpay_order_id,
  razorpay_payment_id: response.razorpay_payment_id,
  razorpay_signature: response.razorpay_signature,
  payment_id: paymentId, // Ensure this is correct
};
```

### Error Handling Best Practices

```typescript
const handlePaymentError = (error: any) => {
  // Log for debugging
  console.error("Payment error:", error);

  // User-friendly message
  let userMessage = "Payment failed. Please try again.";

  if (error.response?.status === 401) {
    userMessage = "Authentication failed. Please login again.";
  } else if (error.code === "NETWORK_ERROR") {
    userMessage = "Network error. Check your connection.";
  } else if (error.message) {
    userMessage = error.message;
  }

  // Show to user
  setError(userMessage);

  // Optional: Send to error tracking service
  // logErrorToSentry(error);
};
```

---

## Best Practices

### 1. Always Load Script Dynamically

```typescript
useEffect(() => {
  loadRazorpayScript().catch((err) => {
    console.error("Failed to load Razorpay:", err);
  });
}, []);
```

### 2. Handle Network Failures

```typescript
try {
  const order = await razorpayService.createOrder(data);
} catch (error) {
  if (error.code === "ECONNABORTED") {
    setError("Request timeout. Please try again.");
  } else if (error.response?.status === 500) {
    setError("Server error. Please try again later.");
  } else {
    setError("Failed to create order.");
  }
}
```

### 3. Secure Token Storage

```typescript
// ✅ Good: Store in sessionStorage (cleared when tab closes)
sessionStorage.setItem("authToken", token);

// ❌ Avoid: Storing sensitive data in localStorage
// localStorage.setItem("authToken", token);

// ❌ Never: Store in window or state that persists
// window.authToken = token;
```

### 4. Implement Retry Logic

```typescript
const retryPayment = async (maxRetries = 3) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await razorpayService.createOrder(data);
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      } else {
        throw error;
      }
    }
  }
};
```

### 5. Show Loading States

```typescript
{isLoading && <LoadingSpinner />}
{!isLoading && (
  <button onClick={handlePaymentClick}>
    Pay ₹{amount}
  </button>
)}
```

### 6. Handle Duplicate Submissions

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return; // Prevent duplicate submission

  setIsSubmitting(true);
  try {
    // Handle payment...
  } finally {
    setIsSubmitting(false);
  }
};
```

### 7. Validate Input Data

```typescript
const validatePaymentData = (data: any) => {
  if (!data.amount || data.amount <= 0) {
    throw new Error("Invalid amount");
  }
  if (!data.subscriptionId) {
    throw new Error("Subscription ID required");
  }
  if (!data.paymentId) {
    throw new Error("Payment ID required");
  }
  return true;
};
```

### 8. Track Payment Completion

```typescript
// Send event to analytics
const trackPaymentSuccess = (paymentData: any) => {
  // Google Analytics
  gtag?.("event", "payment_success", {
    value: paymentData.amount,
    currency: "INR",
    transaction_id: paymentData.id,
  });

  // Mixpanel or other analytics
  // mixpanel.track("Payment Success", paymentData);
};
```

---

## Troubleshooting

### Checkout Not Opening

**Problem:** Button clicked but checkout doesn't appear

**Solutions:**

1. Check browser console for errors
2. Verify `keyId` is loaded: `console.log(keyId)`
3. Verify script is loaded: `console.log(window.Razorpay)`
4. Check network tab for API errors

### Payment Success But Verification Fails

**Problem:** Payment goes through but verification returns error

**Solutions:**

1. Verify `payment_id` matches your internal record
2. Check JWT token is still valid
3. Verify backend endpoint is working
4. Check server logs for errors

### CORS Errors

**Problem:** "Access to XMLHttpRequest blocked by CORS policy"

**Solutions:**

1. Verify backend has CORS enabled
2. Check frontend origin is in CORS whitelist
3. For development, ensure backend runs on correct port

### Token Expired During Payment

**Problem:** JWT token expires during payment process

**Solutions:**

```typescript
// Refresh token before payment
const refreshTokenIfNeeded = async () => {
  const token = localStorage.getItem("authToken");
  if (isTokenExpired(token)) {
    await refreshToken();
  }
};

// Call before payment
await refreshTokenIfNeeded();
```

---

## Environment Variables Summary

### Frontend .env Files

```env
# .env (Development)
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=development

# .env.production
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_ENV=production
```

### Not Needed on Frontend

❌ `RAZORPAY_KEY_SECRET` - **NEVER expose this on frontend**
❌ `RAZORPAY_WEBHOOK_SECRET` - Server-side only

✅ `RAZORPAY_KEY_ID` - Can be exposed (comes from backend config endpoint)

---

## Frontend Checklist

Before deploying to production:

- [ ] Script loads without errors
- [ ] Config endpoint returns Key ID
- [ ] Order creation works
- [ ] Checkout opens
- [ ] Test card payments work
- [ ] Verification succeeds
- [ ] Error messages are user-friendly
- [ ] Loading states are shown
- [ ] Token refresh is implemented
- [ ] Network errors are handled
- [ ] Retry logic works
- [ ] Analytics tracking added
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] No secrets in frontend code

---

## Quick Reference

### 1. Get Config

```typescript
const config = await razorpayService.getConfig();
// Returns: { keyId: "rzp_test_..." }
```

### 2. Create Order

```typescript
const order = await razorpayService.createOrder({
  amount: 500,
  currency: "INR",
  subscription_id: "sub_123",
  description: "Monthly subscription",
});
// Returns: { id: "order_...", amount: 50000, ... }
```

### 3. Open Checkout

```typescript
const rzp = new (window as any).Razorpay({
  key: keyId,
  amount: order.amount,
  order_id: order.id,
  handler: handleSuccess,
});
rzp.open();
```

### 4. Verify Payment

```typescript
const result = await razorpayService.verifyPayment({
  razorpay_order_id: response.razorpay_order_id,
  razorpay_payment_id: response.razorpay_payment_id,
  razorpay_signature: response.razorpay_signature,
  payment_id: paymentId,
});
// Returns: { success: true, data: { ... } }
```

---

## Additional Resources

- [Razorpay Checkout Documentation](https://razorpay.com/docs/payments/checkout/)
- [Razorpay JavaScript SDK](https://razorpay.com/docs/api/javascript/)
- [Test Card Numbers](https://razorpay.com/docs/payments/payments/test-mode/)
- [Payment Gateway Tutorial](https://razorpay.com/docs/payments/)

---

**Last Updated:** January 23, 2026
**Version:** 1.0
**Status:** Complete Frontend Implementation Guide
