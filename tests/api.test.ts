import { describe, test, expect } from 'bun:test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Tests', () => {
    // Helper function to create a test user
    async function createTestUser() {
        return await prisma.user.create({
            data: {
                phoneNumber: `+1555${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
                fullName: 'Test User'
            }
        });
    }

    test("POST /trips - Create a new trip", async () => {
        // Create a test user first
        const user = await createTestUser();
        
        const body = {
            "driverId": user.id,
            "pickup": { "lat": 40.7128, "lng": -74.0060 },
            "dropOff": { "lat": 40.730610, "lng": -73.935242 },
            "seatsOffered": 3,
            "departureTime": "2025-09-13T10:00:00.000Z"
        };

        const req = new Request("http://localhost:3000/trips", {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" }
        });

        const res = await fetch(req);
        expect(res.status).toBe(201);

        const json = await res.json();
        expect(json).toHaveProperty("id");
        expect(json.driverId).toBe(body.driverId);
        
        // Cleanup
        await prisma.trip.delete({ where: { id: json.id } });
        await prisma.user.delete({ where: { id: user.id } });
    });

    test("GET /trips/:id/matches - Find matches for a trip", async () => {
        // Create a test user first
        const user = await createTestUser();
        
        // First, create a trip to get an ID
        const tripBody = {
            "driverId": user.id,
            "pickup": { "lat": 40.7128, "lng": -74.0060 },
            "dropOff": { "lat": 40.730610, "lng": -73.935242 },
            "seatsOffered": 3,
            "departureTime": "2025-09-13T10:00:00.000Z"
        };
        const createReq = new Request("http://localhost:3000/trips", {
            method: "POST",
            body: JSON.stringify(tripBody),
            headers: { "Content-Type": "application/json" }
        });
        const createRes = await fetch(createReq);
        const trip = await createRes.json();
        const tripId = trip.id;

        const req = new Request(`http://localhost:3000/matches/${tripId}`);
        const res = await fetch(req);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(Array.isArray(json)).toBe(true);
        
        // Cleanup
        await prisma.trip.delete({ where: { id: tripId } });
        await prisma.user.delete({ where: { id: user.id } });
    });
});
