<!-- Flight Session Management & Passenger Access System -->
# Flight Session Management & Passenger Access System

## System Overview

This document describes the complete Flight Session Management and Passenger Access System for the In-Flight Meal Ordering System (IFMOD).

The system allows admins to create and manage flight sessions, and provides passengers with two access methods:
1. **QR Code Scanning** (Primary) - Dynamic, reusable QR code
2. **Manual Entry** (Fallback) - Form-based flight lookup

---

## Admin System

### Accessing Session Management

1. Navigate to the **Admin Dashboard** (`/admin`)
2. Click the **Sessions** tab

### Creating a Session

1. Fill in the **Create New Session** form:
   - **Flight Number** (required): e.g., "MH123"
   - **Date** (required): Select from date picker
   - **Departure Time** (optional): e.g., "14:30"
   - **Route** (optional): e.g., "KUL-SIN"

2. Click **Create Session**

### Managing Sessions

**Viewing Sessions:**
- All sessions are displayed in the **All Sessions** list
- Status indicators show: **Upcoming**, **Active**, or **Closed**

**Activating a Session:**
- Click **Activate** on any Upcoming session
- This automatically deactivates all other sessions
- Only ONE session can be Active at a time

**Closing a Session:**
- Click **Close** on the Active session
- This prevents new passengers from joining

---

## Passenger Access Flows

### Flow 1: QR Code (Primary)

```
Passenger scans QR → Lands on /join
      ↓
Frontend fetches GET /api/session/active
      ↓
If Active Session Exists:
  → Redirects to /menu?session_id={ID}
      ↓
If NO Active Session:
  → Shows message: "No active flight session available"
  → Offers link to Manual Entry
```

**QR Code Details:**
- Points to: `/join`
- Static and reusable (no session ID embedded)
- Works with any active session automatically

### Flow 2: Manual Entry (Fallback)

```
Passenger visits /manual-entry
      ↓
Enters: Flight Number + Date (+ optional Seat)
      ↓
Frontend calls: GET /api/session/find?flight_number=MH123&date=2024-04-15
      ↓
Backend searches by flight_number + date
      ↓
THREE POSSIBLE OUTCOMES:

Case 1: No Session Found
  → Returns 404 with error message
  → Frontend shows: "No session found for this flight."

Case 2: Single Session Found ✅
  → Returns the session_id
  → Frontend auto-redirects to: /menu?session_id={ID}

Case 3: Multiple Sessions Found ⚠️
  → Returns list of all matching sessions
  → Frontend shows selection UI:
    "Select your flight"
    - MH123 – 10:00 AM
    - MH123 – 3:00 PM (etc.)
  → Passenger selects one
  → Redirects to menu
```

---

## API Endpoints

### Public Endpoints

#### Get Active Session
```
GET /api/session/active

Response (200 OK):
{
  "success": true,
  "session": {
    "id": "uuid-xxx",
    "session_id": "uuid-xxx",
    "flight_number": "MH123",
    "date": "2024-04-15",
    "departure_time": "14:30",
    "route": "KUL-SIN",
    "status": "active",
    "created_at": "2024-04-13T10:00:00.000Z"
  }
}

Response (404 Not Found):
{
  "error": "No active session found",
  "session": null
}
```

#### Find Sessions
```
GET /api/session/find?flight_number=MH123&date=2024-04-15

Response (200 OK - Single Match):
{
  "success": true,
  "matches": [{
    "id": "uuid-xxx",
    "session_id": "uuid-xxx",
    "flight_number": "MH123",
    "date": "2024-04-15",
    "departure_time": "14:30",
    "status": "active"
  }],
  "count": 1,
  "session_id": "uuid-xxx"
}

Response (200 OK - Multiple Matches):
{
  "success": true,
  "matches": [
    { ... flight 1 ... },
    { ... flight 2 ... }
  ],
  "count": 2,
  "message": "Multiple flights found. Please select your flight."
}

Response (404 Not Found):
{
  "error": "No session found for this flight.",
  "matches": []
}
```

### Admin Endpoints (Require Authentication & Admin Role)

#### Create Session
```
POST /api/session
Authorization: Bearer {token}

Body:
{
  "flight_number": "MH123",
  "date": "2024-04-15",
  "departure_time": "14:30",
  "route": "KUL-SIN"
}

Response (201 Created):
{
  "success": true,
  "session": { ... }
}
```

#### Get All Sessions
```
GET /api/session
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "sessions": [ ... ]
}
```

#### Activate Session
```
PUT /api/session/{id}/activate
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "message": "Session activated",
  "session": { "status": "active", ... }
}

RULE: Only ONE session can be ACTIVE at a time.
When you activate a session, all other sessions are automatically set to "upcoming".
```

#### Close Session
```
PUT /api/session/{id}/close
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "message": "Session closed",
  "session": { "status": "closed", ... }
}
```

#### Update Session
```
PUT /api/session/{id}
Authorization: Bearer {token}

Body (any or all of these):
{
  "flight_number": "MH123",
  "date": "2024-04-15",
  "departure_time": "14:30",
  "route": "KUL-SIN"
}

Response (200 OK):
{
  "success": true,
  "message": "Session updated",
  "session": { ... }
}
```

---

## Database Schema

### Firestore Collection: `flight_sessions`

```
{
  id: "doc-id" (auto-generated by Firestore)
  
  session_id: "550e8400-e29b-41d4-a716-446655440000" (UUID)
  flight_number: "MH123"
  date: "2024-04-15" (YYYY-MM-DD format)
  departure_time: "14:30" (HH:MM format, or null)
  route: "KUL-SIN" (optional)
  
  status: "upcoming" | "active" | "closed"
  
  created_at: "2024-04-13T10:00:00.000Z"
  updated_at: "2024-04-13T10:00:00.000Z"
}
```

---

## Key Rules & Constraints

### Session Rules
- ✅ **Only ONE session can be ACTIVE at a time**
  - When you activate a session, all others become "upcoming"
  - This is enforced at the database level with a transaction

- ✅ **Flight number is case-insensitive**
  - Store and compare as uppercase
  - Frontend auto-converts to uppercase

- ✅ **Date is required**
  - Must be in YYYY-MM-DD format
  - Used for searching sessions

### Passenger Rules
- ✅ **Session lookup requires flight_number + date**
  - Departure time is NOT required
  - Seat number is optional

- ✅ **Multiple sessions with same flight/date are supported**
  - Passengers see a selection UI
  - They choose the correct departure time

### UX Rules
- ✅ **Keep inputs minimal**
  - No departure time input required
  - Seat is optional
  - Only flight number and date are mandatory

- ✅ **Auto-redirect when possible**
  - Single match → Auto-redirect
  - QR code → Auto-redirect

- ✅ **Clear error messages**
  - Show specific reason (no session, multiple options, etc.)
  - Provide fallback options

---

## Frontend Components Structure

```
src/
├── pages/
│   ├── JoinPage.jsx                 # QR code landing (/join)
│   ├── JoinPage.module.css
│   ├── ManualEntryPage.jsx          # Manual flight lookup (/manual-entry)
│   ├── ManualEntryPage.module.css
│   └── AdminDashboardPage.jsx       # Added SessionsTab
│
├── components/
│   └── admin/
│       ├── SessionsTab.jsx          # Session management UI
│       └── SessionsTab.module.css
│
└── services/
    └── flightSessionService.js      # API client
```

---

## URL Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | SessionEntryPage | Home/default entry |
| `/join` | JoinPage | QR code landing (auto-detect active) |
| `/manual-entry` | ManualEntryPage | Manual flight lookup form |
| `/menu` | MenuPage | Meal selection (requires session_id) |
| `/admin` | AdminDashboardPage | Admin dashboard (with Sessions tab) |

---

## Testing the System

### Test QR Code Flow
1. Create a session via Admin → Sessions tab
2. Activate the session
3. Navigate to `http://localhost:3000/join`
4. Should auto-redirect to `/menu`

### Test Manual Entry Flow
1. Create a session (e.g., MH123 on 2024-04-15)
2. Navigate to `http://localhost:3000/manual-entry`
3. Enter flight number and date
4. Should redirect to `/menu`

### Test Multiple Sessions
1. Create two sessions with same flight_number, different times
2. Both have same date
3. Search via manual entry
4. Should show selection UI with both options
5. Select one → Redirects to menu

### Test Single Match
1. Create one session (MH456 on 2024-04-15)
2. Search for MH456 on 2024-04-15
3. Should auto-redirect (no selection UI)

### Test No Match
1. Search for flight that doesn't exist
2. Should show error message
3. Offer link to try again

---

## Error Handling

| Error | Cause | User Message |
|-------|-------|--------------|
| No active session | No session on /join | "No active flight session available." |
| No match found | Flight/date combo not found | "No session found for this flight." |
| Bad input | Missing flight number or date | Validation error with field highlight |
| Network error | Server unreachable | "Could not connect to server" |

---

## Security Considerations

### Authentication
- Admin endpoints require valid JWT token
- Token obtained from existing auth system
- Only admins/crew can create/manage sessions

### Data Validation
- Flight number: Required, trimmed and uppercase
- Date: Required, must be valid date format
- Departure time: Optional
- Route: Optional

### Production Checklist
- [ ] Use environment variables for API URL
- [ ] Implement rate limiting on search endpoint
- [ ] Add audit logging for session changes
- [ ] Implement session access controls (seat-based if needed)
- [ ] Add analytics for access patterns
- [ ] Backup Firestore data regularly

---

## Future Enhancements

- [ ] QR codes with custom branding
- [ ] Session expiration after flight landsing
- [ ] Passenger message broadcasting per session
- [ ] Session analytics dashboard
- [ ] Mobile app integration
- [ ] Multi-language support
- [ ] Seat-based access restrictions
- [ ] Session templates for recurring routes

---

## Support & Troubleshooting

### Issue: "No active session" when QR is scanned
**Check:**
1. Did you create a session in the Admin panel?
2. Did you click "Activate"?
3. Is the session date today or later?

### Issue: Multiple sessions showing when only one exists
**Check:**
1. Did you search with correct flight number and date?
2. Are there other sessions with same flight but different dates?
3. Try entering exact flight number format (e.g., exact capitalization)

### Issue: Manual entry not finding session
**Check:**
1. Is the session created and active?
2. Is the date exactly correct (YYYY-MM-DD)?
3. Is the flight number spelled correctly?

---

End of Documentation
