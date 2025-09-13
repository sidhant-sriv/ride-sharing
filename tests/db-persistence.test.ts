import { describe, test, expect } from 'bun:test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Persistence Test', () => {
    test("POST /trips - Verify data persists in database", async () => {
        // Create a test user first
        const user = await prisma.user.create({
            data: {
                phone: `+1555${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
                name: 'Persistence Test User'
            }
        });
        
        const body = {
            "userId": user.id,
            "origin": [-74.0060, 40.7128],
            "destination": [-73.935242, 40.730610],
            "seatsRequired": 1,
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
        expect(json.userId).toBe(body.userId);
        
        console.log('Created trip with ID:', json.id);
        
        // Verify the trip is actually stored in the database
        const tripFromDb = await prisma.trip.findUnique({
            where: { id: json.id },
            include: { user: true }
        });
        
        expect(tripFromDb).not.toBeNull();
        expect(tripFromDb?.userId).toBe(user.id);
        expect(tripFromDb?.seatsRequired).toBe(1);
        expect(tripFromDb?.seatsOffered).toBe(3);
        expect(tripFromDb?.user.name).toBe('Persistence Test User');
        
        // Check if H3 cells and other computed fields are stored
        expect(tripFromDb?.h3Cells).toBeDefined();
        expect(Array.isArray(tripFromDb?.h3Cells)).toBe(true);
        expect(tripFromDb?.h3Cells.length).toBeGreaterThan(0);
        
        expect(tripFromDb?.snappedPolyline).toBeDefined();
        expect(typeof tripFromDb?.snappedPolyline).toBe('string');
        
        expect(tripFromDb?.routeLengthM).toBeDefined();
        expect(typeof tripFromDb?.routeLengthM).toBe('number');
        expect(tripFromDb?.routeLengthM).toBeGreaterThan(0);
        
        console.log('Trip verification complete:');
        console.log('- H3 cells count:', tripFromDb?.h3Cells.length);
        console.log('- Route length (m):', tripFromDb?.routeLengthM);
        console.log('- Snapped polyline length:', tripFromDb?.snappedPolyline?.length);
        
        // Note: We're NOT cleaning up this test data to verify persistence
        console.log('Test data left in database for verification');
    });
});
