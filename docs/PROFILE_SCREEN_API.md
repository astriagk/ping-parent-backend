# Profile Screen API Documentation

## Overview
This document describes the API endpoints for the Profile Screen where parents can view and manage their profile information.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require JWT authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## API Endpoints

### 1. Get Parent Profile
Retrieves the authenticated parent's profile information.

**Endpoint:** `GET /parent/profile`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62701",
      "coordinates": {
        "lat": 39.7817,
        "lng": -89.6501
      }
    },
    "role": "parent",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a parent
- `404 Not Found`: Parent profile not found
- `500 Internal Server Error`: Server error

---

### 2. Update Parent Profile
Updates the authenticated parent's profile information.

**Endpoint:** `PUT /parent/profile`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": {
    "street": "456 Oak Ave",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62702",
    "coordinates": {
      "lat": 39.7820,
      "lng": -89.6505
    }
  }
}
```

**Allowed Fields:**
- `firstName` (string) - Parent's first name
- `lastName` (string) - Parent's last name
- `phone` (string) - Phone number
- `address` (object) - Address information
  - `street` (string)
  - `city` (string)
  - `state` (string)
  - `zipCode` (string)
  - `coordinates` (object)
    - `lat` (number)
    - `lng` (number)

**Note:** The following fields CANNOT be updated via this endpoint:
- `email` - Use separate email change process
- `passwordHash` - Use password reset flow
- `role` - Cannot be changed
- `_id` - Cannot be changed

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": {
      "street": "456 Oak Ave",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62702",
      "coordinates": {
        "lat": 39.7820,
        "lng": -89.6505
      }
    },
    "role": "parent",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: No updates provided or invalid data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not a parent
- `404 Not Found`: Parent profile not found or no changes made
- `500 Internal Server Error`: Server error

---

### 3. Logout
Logs out the current user. This is a client-side operation that simply acknowledges the logout request.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Content-Type: application/json
```

**Note:** No authentication required. The client should remove the JWT token from storage after calling this endpoint.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Client-Side Actions:**
After receiving successful logout response, the client should:
1. Remove the access token from localStorage/sessionStorage
2. Clear any cached user data
3. Redirect to login screen

**Error Responses:**
- `500 Internal Server Error`: Server error

---

## Frontend Integration Example

### Profile Management Component

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE}/parent/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProfile(response.data.data);
      setFormData({
        firstName: response.data.data.firstName,
        lastName: response.data.data.lastName,
        phone: response.data.data.phone || '',
        address: response.data.data.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        // Token expired, redirect to login
        handleLogout();
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_BASE}/parent/profile`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setProfile(response.data.data);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {!editing ? (
        <div className="profile-view">
          <div className="profile-field">
            <label>Name:</label>
            <span>{profile.firstName} {profile.lastName}</span>
          </div>

          <div className="profile-field">
            <label>Email:</label>
            <span>{profile.email}</span>
          </div>

          <div className="profile-field">
            <label>Phone:</label>
            <span>{profile.phone || 'Not provided'}</span>
          </div>

          <div className="profile-field">
            <label>Address:</label>
            <span>
              {profile.address ? (
                <>
                  {profile.address.street}<br />
                  {profile.address.city}, {profile.address.state} {profile.address.zipCode}
                </>
              ) : (
                'Not provided'
              )}
            </span>
          </div>

          <div className="profile-field">
            <label>Member Since:</label>
            <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>

          <button onClick={() => setEditing(true)} className="edit-btn">
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdateProfile} className="profile-edit">
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1234567890"
            />
          </div>

          <div className="form-group">
            <label>Street:</label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>City:</label>
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>State:</label>
            <input
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>ZIP Code:</label>
            <input
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                fetchProfile(); // Reset form data
              }}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProfileScreen;
```

---

## Testing with Postman/cURL

### Get Profile
```bash
curl -X GET http://localhost:3000/api/parent/profile \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json"
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/api/parent/profile \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "address": {
      "street": "456 Oak Ave",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62702"
    }
  }'
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json"
```

---

## Security Notes

1. **Token Expiration:** Access tokens expire after 15 minutes. The client should handle token refresh or redirect to login.

2. **Sensitive Fields:** The following fields are automatically excluded from responses:
   - `passwordHash`
   - `verificationToken`

3. **Update Restrictions:** Email and role cannot be changed via the profile update endpoint.

4. **Logout:** This is primarily a client-side operation. The JWT token cannot be invalidated server-side in the current stateless implementation. For true logout, consider:
   - Implementing a token blacklist
   - Using refresh tokens with revocation
   - Setting short token expiration times

---

## Error Handling

All endpoints follow the standard error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Related Documentation

- [Parent Dashboard API](PARENT_DASHBOARD_API.md) - Home/Dashboard screen endpoints
- [Track Trip Implementation](TRACK_TRIP_IMPLEMENTATION.md) - Trip tracking endpoints

---

## Next Steps

1. Test the profile update functionality
2. Add profile picture upload feature (future enhancement)
3. Add email change with verification flow
4. Implement account deletion feature
5. Add activity log/history

---

## API Endpoint Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/parent/profile` | GET | Get profile | Yes (Parent) |
| `/parent/profile` | PUT | Update profile | Yes (Parent) |
| `/auth/logout` | POST | Logout | No |
