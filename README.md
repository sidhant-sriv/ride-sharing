# Ride Sharing Platform

A comprehensive ride-sharing platform built with Node.js, Express, Prisma, and PostgreSQL. The system enables users to create trips, find ride matches using geospatial algorithms, and manage carpooling arrangements.

## 🚀 Features

- **User Management**: Complete CRUD operations for user profiles
- **Trip Creation**: Drivers can create trips with pickup/dropoff locations and available seats
- **Intelligent Matching**: Advanced geospatial matching using H3 hexagonal indexing and Mapbox routing
- **Real-time Route Processing**: Integration with Mapbox for accurate route calculation and polyline generation
- **Database Persistence**: PostgreSQL with Prisma ORM for reliable data storage
- **RESTful API**: Clean, production-ready API endpoints with proper error handling

## 📋 Requirements

- **Node.js** v18+ (using Bun runtime)
- **PostgreSQL** database
- **Mapbox API Token** for routing and geospatial operations
- **Docker** (optional, for containerized setup)

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ride-sharing
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ridesharing"
   MAPBOX_ACCESS_TOKEN="your_mapbox_access_token_here"
   PORT=3000
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma client
   bunx prisma generate
   
   # Run migrations
   bunx prisma migrate deploy
   ```

5. **Add sample data (optional):**
   ```bash
   bun run add-sample-data.ts
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
bun run start
```

### Using Docker
```bash
docker compose up -d  # Start PostgreSQL
bun run start         # Start the application
```

### Running Tests
```bash
bun test
```

## 📖 API Documentation

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /health
```
Returns server health status.

---

### 👥 User Endpoints

#### Create User
```http
POST /users
Content-Type: application/json

{
  "phoneNumber": "+1555123456",
  "fullName": "John Doe",
  "age": 30,
  "gender": "male"
}
```

#### Get All Users
```http
GET /users
```

#### Get User by ID
```http
GET /users/{userId}
```

#### Update User
```http
PUT /users/{userId}
Content-Type: application/json

{
  "fullName": "John Smith",
  "age": 31
}
```

#### Delete User
```http
DELETE /users/{userId}
```

---

### 🚗 Trip Endpoints

#### Create Trip
```http
POST /trips
Content-Type: application/json

{
  "driverId": "user-uuid-here",
  "pickup": {
    "lat": 40.7589,
    "lng": -73.9851
  },
  "dropOff": {
    "lat": 40.6892,
    "lng": -73.9442
  },
  "seatsOffered": 3,
  "departureTime": "2025-09-14T08:00:00Z"
}
```

**Response includes:**
- Trip ID and basic information
- Calculated route data (polyline, distance)
- H3 geospatial indexing for efficient matching

#### Get Trip by ID
```http
GET /trips/{tripId}
```

#### Update Trip Status
```http
PUT /trips/{tripId}/status
Content-Type: application/json

{
  "status": "matched" | "in_progress" | "completed" | "cancelled"
}
```

#### Get Trips by Driver
```http
GET /trips/driver/{driverId}
```

---

### 🎯 Match Endpoints

#### Find Matches for Trip
```http
GET /matches/{tripId}
```
Returns potential ride matches based on:
- Geographic proximity (H3 hexagonal indexing)
- Route overlap analysis
- Departure time compatibility
- Available seats

#### Get Existing Matches
```http
GET /matches/existing/{tripId}
```
Returns already created match records for a trip.

#### Update Match Status
```http
PUT /matches/{matchId}/status
Content-Type: application/json

{
  "status": "accepted" | "rejected"
}
```

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `phoneNumber` (String, Unique)
- `fullName` (String)
- `age` (Integer, Optional)
- `gender` (Enum: male/female/other/prefer_not_to_say)
- `createdAt`, `updatedAt` (Timestamps)

### Trips Table
- `id` (UUID, Primary Key)
- `driverId` (UUID, Foreign Key → Users)
- `pickupLat`, `pickupLng` (Float)
- `dropOffLat`, `dropOffLng` (Float)
- `departureTime` (DateTime)
- `seatsOffered` (Integer)
- `status` (Enum: pending/matched/in_progress/completed/cancelled)
- `polyline` (String, Mapbox-generated route)
- `routeLengthM` (Float, Route distance in meters)
- `createdAt`, `updatedAt` (Timestamps)

### Matches Table
- `id` (UUID, Primary Key)
- `tripAId`, `tripBId` (UUID, Foreign Keys → Trips)
- `matchScore` (Float, Similarity score)
- `status` (Enum: proposed/accepted/rejected/cancelled)
- `createdAt`, `updatedAt` (Timestamps)

## 🏗️ Architecture

### Project Structure
```
ride-sharing/
├── src/
│   ├── routes/
│   │   ├── user-routes.ts      # User CRUD endpoints
│   │   ├── trip-routes.ts      # Trip management endpoints
│   │   └── match-routes.ts     # Matching endpoints
│   ├── user-service.ts         # User business logic
│   ├── trip-service.ts         # Trip creation & Mapbox integration
│   └── match-service.ts        # Geospatial matching algorithms
├── tests/
│   ├── api.test.ts            # API endpoint tests
│   └── db-persistence.test.ts  # Database integration tests
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── index.ts                   # Express server setup
├── add-sample-data.ts         # Sample data generator
└── docker-compose.yml         # PostgreSQL container
```

### Key Technologies

- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Geospatial**: H3 hexagonal indexing + Mapbox APIs
- **Testing**: Bun test framework
- **Containerization**: Docker for database

### Matching Algorithm

The ride matching system uses:

1. **H3 Hexagonal Indexing**: Converts lat/lng coordinates to hexagonal cells for efficient geographic queries
2. **Route Analysis**: Calculates actual driving routes using Mapbox Directions API
3. **Polyline Overlap**: Determines route similarity by analyzing polyline intersections
4. **Time Compatibility**: Matches trips with compatible departure times
5. **Seat Availability**: Ensures sufficient seats for potential matches

## 🧪 Testing

The project includes comprehensive tests:

- **API Tests**: Verify all endpoints work correctly
- **Database Persistence**: Ensure data is properly stored and retrieved
- **Integration Tests**: Test complete workflows

### Sample Test Data

The system includes 5 sample users and trips covering various NYC routes:
- Manhattan ↔ Brooklyn
- Queens → Manhattan  
- Manhattan → JFK Airport
- Bronx → Manhattan

## 🚀 Production Deployment

### Environment Variables
Ensure these are set in production:
```env
DATABASE_URL=postgresql://prod-connection-string
MAPBOX_ACCESS_TOKEN=pk.your-production-token
PORT=3000
NODE_ENV=production
```

### Database Migration
```bash
bunx prisma migrate deploy
```

### Health Monitoring
The `/health` endpoint provides basic server health checks.

## 🔧 Development

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma` and run `bunx prisma migrate dev`
2. **API Endpoints**: Add routes in appropriate `src/routes/` files
3. **Business Logic**: Implement in service files (`src/*-service.ts`)
4. **Tests**: Add corresponding tests in `tests/` directory

### Code Style
- TypeScript with strict type checking
- RESTful API conventions
- Proper error handling and logging
- Production-ready route organization

## 📝 License

This project is licensed under the MIT License.