# Bricks Management System

A full-stack web application for managing brick production in a brick industry.

## Tech Stack

- **Frontend**: Angular 17+ (standalone components, reactive forms, Bootstrap 5)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose ODM)

## Project Structure

```
/c/KVS/
├── frontend/          # Angular SPA
│   └── src/
│       └── app/
│           ├── pages/
│           │   ├── dashboard/          # Dashboard with summary stats
│           │   ├── production/         # Brick production management
│           │   ├── kiln-loading/       # Loading bricks into kilns
│           │   ├── kiln-manufacture/   # Manufactured bricks from kilns
│           │   └── brick-sales/        # Sales of manufactured bricks
│           └── services/
│               └── api.service.ts      # HTTP client for all API calls
├── backend/           # Express REST API
│   ├── server.js      # Express server entry point (port 3000)
│   ├── db/
│   │   └── database.js  # MongoDB/Mongoose connection
│   ├── models/          # Mongoose schemas
│   │   ├── BrickProduction.js
│   │   ├── KilnLoading.js
│   │   ├── KilnManufacture.js
│   │   └── BrickSale.js
│   └── routes/          # REST API routes
│       ├── production.js
│       ├── kiln-loading.js
│       ├── kiln-manufacture.js
│       ├── brick-sale.js
│       └── dashboard.js
└── CLAUDE.md
```

## Application Pages

### 1. Brick Production
Record raw brick production batches with batch number, brick type (Red, Fly Ash, Cement, Clay, Fire), quantity, and production date.

### 2. Kiln Loading (Brick Put on Kiln)
Track which production batches are loaded into which kilns, with loading dates and expected completion dates.

### 3. Kiln Manufacturing (Manufactured Bricks in Kiln)
Record output from kilns - manufactured quantity, damaged quantity, quality grade (A/B/C), and manufacturing date.

### 4. Brick Sales (Sold Bricks from Kiln)
Manage sales with buyer info, quantity sold, price per brick, total amount (auto-calculated), and payment status.

### 5. Dashboard
Overview with summary cards (total produced, in kiln, manufactured, sold), revenue, and recent activities.

## Data Flow

```
Brick Production → Kiln Loading → Kiln Manufacturing → Brick Sales
```

Each stage references the previous one via MongoDB ObjectId references with Mongoose populate.

## API Endpoints

| Resource | Endpoint | Methods |
|---|---|---|
| Productions | `/api/productions` | GET, POST, PUT, DELETE |
| Kiln Loadings | `/api/kiln-loadings` | GET, POST, PUT, DELETE |
| Kiln Manufactures | `/api/kiln-manufactures` | GET, POST, PUT, DELETE |
| Brick Sales | `/api/brick-sales` | GET, POST, PUT, DELETE |
| Dashboard | `/api/dashboard` | GET |

## Running the Project

### Prerequisites
- Node.js 18+
- MongoDB running on localhost:27017

### Backend
```bash
cd backend
npm install
npm run dev     # Development with nodemon
npm start       # Production
```
Server runs on http://localhost:3000

### Frontend
```bash
cd frontend
npm install
npm start       # ng serve
```
App runs on http://localhost:4200

## Conventions
- All Angular components are standalone (no NgModules)
- Forms use Angular Reactive Forms with validation
- Backend routes are async/await with try/catch error handling
- MongoDB references use Mongoose populate for joins
- Bootstrap 5 for UI styling with brick/terracotta color theme (#c0392b, #e74c3c, #8B4513)
