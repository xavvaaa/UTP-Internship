# Composite indexes for flight session queries

Create these in the Firebase console (Firestore → Indexes) if queries fail at runtime:

| Collection           | Fields (order)                                              | Query scope |
|---------------------|-------------------------------------------------------------|-------------|
| `flight_sessions`   | `flight_number` ASC, `date` ASC, `status` ASC               | Transaction / create: active sessions for same flight day |
| `flight_sessions`   | `access_code` ASC                                           | Equality (often auto-indexed as single field) |
| `flight_sessions`   | `status` ASC, `ended_at` DESC                               | Summary: recent ended (global) |
| `flight_sessions`   | `flight_number` ASC, `date` ASC, `status` ASC, `ended_at` DESC | Summary filtered ended |
| `orders`            | `flightId` ASC, `timestamp` ASC                               | Crew order list subscription |
