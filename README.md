# Ride Sharing Platform

A ride-sharing platform built with Node.js, Express, and Prisma. It allows users to create trips and find matches for carpooling.

## How to Run the Project

1.  **Install dependencies:**
    ```bash
    bun install
    ```

2.  **Start the database:**
    ```bash
    docker compose up -d
    ```

3.  **Run database migrations:**
    ```bash
    bunx prisma migrate dev
    ```

4.  **Start the server:**
    ```bash
    bun run start
    ```

The server will be available at http://localhost:3000.

## How to Run Tests

Run the test suite using the following command:

```bash
bun test
```

## Modules

-   `index.ts`: The main entry point of the application. It initializes the Express server and sets up the API routes.

-   `src/user-service.ts`: Manages all user-related operations, such as creating, retrieving, updating, and deleting users.

-   `src/trip-service.ts`: Handles the business logic for trips. This includes creating new trips, fetching trip details, and managing trip statuses. It integrates with Mapbox to get route information.

-   `src/match-service.ts`: Contains the core logic for finding ride matches. It uses geospatial queries and route analysis to find suitable matches between trips.

-   `src/routes/`: This directory contains the API route handlers for users, trips, and matches.
    -   `user-routes.ts`: Defines the API endpoints for user management (CRUD operations).
    -   `trip-routes.ts`: Defines the API endpoints for trip management.
    -   `match-routes.ts`: Defines the API endpoints for finding and managing matches.

-   `src/utils.ts`: Provides utility functions, such as distance calculation and polyline overlap analysis.

-   `src/constants.ts`: Stores constant values used throughout the application, like proximity thresholds and H3 resolution.

-   `src/types.ts`: Defines custom TypeScript types and interfaces used in the project.

-   `tests/`: Contains the test files for the application.
    -   `api.test.ts`: Includes tests for the main API endpoints.