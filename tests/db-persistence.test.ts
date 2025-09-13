import { describe, test, expect } from 'bun:test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Persistence Test', () => {
    test("POST /trips - Verify data persists in database", async () => {
        // Create a test user first
        const user = await prisma.user.create({
            data: {
                phoneNumber: `+1555${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
                fullName: 'Chavi'
            }
        });
        
        const body = {
            "driverId": user.id,
            "pickup": { "lat": 40.7128, "lng": -74.0060 },
            "dropOff": { "lat": 40.730610, "lng": -73.935242 },
            "seatsOffered": 3,
            "departureTime": "2025-09-13T10:00:00.000Z"
        };

        console.log('Creating trip for user:', user.id);

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
        
        console.log('Created trip with ID:', json.id);
        
        // Verify the trip is actually stored in the database
        const tripFromDb = await prisma.trip.findUnique({
            where: { id: json.id },
            include: { driver: true }
        });
        
        expect(tripFromDb).not.toBeNull();
        expect(tripFromDb?.driverId).toBe(user.id);
        // Verify basic trip properties
        expect(tripFromDb?.seatsOffered).toBe(3);
        expect(tripFromDb?.driver.fullName).toBe('Chavi');
        
        // Check if route data is stored
        expect(tripFromDb?.routeLengthM).toBeDefined();
        expect(typeof tripFromDb?.routeLengthM).toBe('number');
        
        console.log('Trip verification complete:');
        console.log('- Route length (m):', tripFromDb?.routeLengthM);
        console.log('- Polyline:', tripFromDb?.polyline?.length);
        
        // Note: We're NOT cleaning up this test data to verify persistence
        console.log('Test data left in database for verification');
    });
});
