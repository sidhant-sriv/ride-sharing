# Ride Sharing Platform

A ride-sharing platform built with Node.js, Express, and Prisma. It allows users to create trips and find matches for carpooling.

## Demo

![Demo Video](demo.mov)

## How to Run the Project

1.  **Set up environment variables:**

    Create a `.env` file in the root directory and add the following content. Make sure to replace the placeholder values with your actual credentials.

    ```
    # Mapbox Access Token
    MAPBOX_ACCESS_TOKEN="your_mapbox_access_token_here"

    # Database connection URL
    DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"

    # Port for the application server
    PORT=3000

    # PostgreSQL credentials (used by Docker Compose)
    POSTGRES_USER=johndoe
    POSTGRES_PASSWORD=randompassword
    POSTGRES_DB=mydb
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Start the database:**
    ```bash
    docker compose up -d
    ```

4.  **Run database migrations:**
    ```bash
    bunx prisma migrate dev
    ```

5.  **Start the server:**
    ```bash
    bun run start
    ```

The server will be available at http://localhost:3000.

## How to Run Tests

Run the test suite using the following command:

```bash
bun test
```

## API Routes

### User Routes

-   `POST /users`: Create a new user.
-   `GET /users`: Get a list of all users.
-   `GET /users/:id`: Get a user by their ID.
-   `PUT /users/:id`: Update a user's information.
-   `DELETE /users/:id`: Delete a user.

### Trip Routes

-   `POST /trips`: Create a new trip.
-   `GET /trips/:id`: Get a trip by its ID.
-   `PUT /trips/:id`: Update a trip's information.
-   `DELETE /trips/:id`: Delete a trip.
-   `PUT /trips/:id/status`: Update the status of a trip.
-   `GET /trips/driver/:driverId`: Get all trips for a specific driver.

### Match Routes

-   `GET /matches/:tripId`: Find potential matches for a trip.
-   `GET /matches/existing/:tripId`: Get existing matches for a trip.
-   `PUT /matches/:matchId/status`: Update the status of a match.

