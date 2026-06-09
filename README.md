# SkyServe

SkyServe is a web-based in-flight meal ordering system designed for passengers, cabin crew, and administrators. The application allows passengers to join an active flight session, browse available meals, customize their order, add allergy or preference notes, and track order status. Cabin crew and administrators can manage menus, monitor orders, update order progress, view seat maps, and generate operational reports.

## Project Overview

Airline meal service is often handled manually, which can lead to slow ordering, unclear passenger preferences, and difficulty tracking meal preparation. SkyServe improves this process by providing a mobile-friendly passenger ordering experience and a real-time operations dashboard for crew.

The system is built around a flight session. Each flight session has an access code that passengers use to join with their seat number. Once joined, passengers can place one order for that seat. Crew members can then view orders by seat, update statuses, and use reports to understand meal demand and passenger preferences.

## Main Features

- Passenger access-code login
- Mobile-friendly meal browsing and ordering
- Meal customization with drinks, desserts, and snacks
- Passenger notes for allergies, preferences, and special instructions
- Live order status tracking
- Cabin crew order dashboard
- Seat map view for order monitoring
- Menu management for flight-specific meals
- Admin session management
- Access code display for sharing with nearby passengers
- Generated reports in PDF, DOCX, XLSX, and CSV formats
- Firebase Authentication and Firestore-backed data storage
- Optional Aviationstack flight route lookup

## User Roles

### Passenger

Passengers can:

- Enter a flight access code
- Register their seat number
- Browse meals available for the flight
- Customize meal add-ons
- Add allergy or preference notes
- Submit an order
- Track order status
- Exit the session with confirmation

### Cabin Crew

Cabin crew can:

- Join an assigned flight session
- View passenger orders
- Update order status
- Use the seat map to locate orders
- View passenger notes and allergy information
- Manage menus when assigned to the active flight

### Administrator

Administrators can:

- Create and manage flight sessions
- Assign crew members
- Manage menu items
- View all orders for a flight
- Generate reports
- Manage users and system settings

## Technology Stack

### Frontend

- React
- Vite
- React Router
- CSS Modules
- Lucide React icons
- QR scanner support

### Backend

- Node.js
- Express
- Firebase Admin SDK
- REST API endpoints for sessions, orders, menus, reports, settings, and user management

### Database and Authentication

- Firebase Authentication
- Cloud Firestore
- Firebase Storage or external image hosting for menu images

## System Workflow

1. An administrator creates a flight session.
2. The system generates a passenger access code.
3. Passengers join the flight using the access code and their seat number.
4. Passengers browse meals and submit an order.
5. The order is stored in Firestore and shown to crew in real time.
6. Crew members update the order status from pending to preparing to delivered.
7. Reports summarize demand, order status, and passenger preferences.

## Installation

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Then fill in the Firebase and optional Aviationstack values in `.env`.

## Environment Variables

The app uses the following main environment variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
API_PORT=3001
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_JSON=
AVIATIONSTACK_API_KEY=
```

## Running the App

Start the frontend:

```bash
npm run dev
```

Start the backend API:

```bash
npm run api
```

For backend development with automatic restarts:

```bash
npm run dev:api
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Important Routes

- `/` - passenger access-code login
- `/menu` - passenger meal menu
- `/menu/customize/:mealId` - passenger order customization
- `/admin-login` - admin login
- `/cabin-crew-login` - cabin crew login
- `/admin` - admin dashboard
- `/crew/dashboard` - crew dashboard

## Reports

SkyServe can generate operational reports in:

- PDF
- DOCX
- XLSX
- CSV

Generated report files are named `skyserve` with the matching file extension, such as `skyserve.pdf` or `skyserve.xlsx`.

Reports include:

- Total orders
- Completion rate
- Top meals
- Add-on preferences
- Order status breakdown
- Passenger notes in exported order data
- Inventory planning insights

## Notes About NLP

The current version does not use Natural Language Processing models. Passenger allergy and preference notes are stored as free-text order notes and displayed to crew/admin users. These notes are not automatically classified, summarized, or interpreted by an NLP model.

NLP could be added in a future version to automatically detect allergy keywords, highlight urgent dietary restrictions, summarize passenger preferences, or classify notes into operational categories.

## Known Technical Considerations

- Full lint currently reports existing issues that should be cleaned before production use.
- Backend authorization should be tightened for session management, menu ownership, and passenger order placement.
- Passenger ordering should eventually use a secure passenger join token to prevent ordering for another occupied seat.
- Report exports should remain consistent across all formats.

## Project Purpose

SkyServe demonstrates how a digital ordering system can improve in-flight meal service by reducing manual communication, improving order visibility, supporting passenger preferences, and giving crew a clearer operational dashboard.

