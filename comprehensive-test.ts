import { describe, test, expect, afterAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000';

// Helper function to create a user
async function createUser(fullName: string, phoneNumber: string) {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    body: JSON.stringify({
      fullName,
      phoneNumber,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

// Helper function to create a trip
async function createTrip(tripData: any) {
  const res = await fetch(`${API_URL}/trips`, {
    method: 'POST',
    body: JSON.stringify(tripData),
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

describe('Comprehensive Match Service Tests', () => {
  const users: any[] = [];
  const trips: any[] = [];

  test('should perform a comprehensive match test', async () => {
    // 1. Create users
    const driver = await createUser('Driver User', '+1111111111');
    const rider1 = await createUser('Rider User 1', '+2222222222');
    const rider2 = await createUser('Rider User 2', '+3333333333');
    const rider3 = await createUser('Rider User 3', '+4444444444');
    users.push(driver, rider1, rider2, rider3);

    expect(driver).toHaveProperty('id');
    expect(rider1).toHaveProperty('id');
    expect(rider2).toHaveProperty('id');
    expect(rider3).toHaveProperty('id');

    // 2. Create a driver trip
    const driverTrip = await createTrip({
      driverId: driver.id,
      pickup: { lat: 40.7128, lng: -74.006 }, // Downtown NYC
      dropOff: { lat: 40.7831, lng: -73.9712 }, // Uptown NYC
      departureTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 mins from now
      seatsOffered: 3,
      seatsRequired: 0,
    });
    trips.push(driverTrip);
    expect(driverTrip).toHaveProperty('id');

    // 3. Create matching rider trips
    const riderTrip1 = await createTrip({
      driverId: rider1.id,
      pickup: { lat: 40.7128, lng: -74.006 },
      dropOff: { lat: 40.7831, lng: -73.9712 },
      departureTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      seatsRequired: 1,
      seatsOffered: 0,
    });
    trips.push(riderTrip1);

    const riderTrip2 = await createTrip({
      driverId: rider2.id,
      pickup: { lat: 40.7128, lng: -74.006 },
      dropOff: { lat: 40.7831, lng: -73.9712 },
      departureTime: new Date(Date.now() + 1000 * 60 * 35).toISOString(), // 5 mins difference
      seatsRequired: 2,
      seatsOffered: 0,
    });
    trips.push(riderTrip2);

    // 4. Create a non-matching rider trip
    const nonMatchingRiderTrip = await createTrip({
        driverId: rider3.id,
        pickup: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
        dropOff: { lat: 34.1522, lng: -118.3437 },
        departureTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        seatsRequired: 1,
        seatsOffered: 0,
    });
    trips.push(nonMatchingRiderTrip);

    // 5. Find matches for the driver trip
    let matchesRes = await fetch(`${API_URL}/matches/${driverTrip.id}`);
    let matches = await matchesRes.json();
    expect(matchesRes.status).toBe(200);
    expect(matches.length).toBe(2); // Should match with rider1 and rider2

    const updateRes = await fetch(`${API_URL}/trips/${riderTrip1.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            dropOff: { lat: 34.0522, lng: -118.2437 } 
        }),
        headers: { 'Content-Type': 'application/json' },
    });
    expect(updateRes.status).toBe(200);
    
    matchesRes = await fetch(`${API_URL}/matches/${driverTrip.id}`);
    matches = await matchesRes.json();
    expect(matchesRes.status).toBe(200);
    expect(matches.length).toBe(1); 
    const deleteRes = await fetch(`${API_URL}/trips/${riderTrip2.id}`, {
        method: 'DELETE'
    });
    expect(deleteRes.status).toBe(200);

    matchesRes = await fetch(`${API_URL}/matches/${driverTrip.id}`);
    matches = await matchesRes.json();
    expect(matchesRes.status).toBe(200);
    expect(matches.length).toBe(0); 
  }, 30000); 

  afterAll(async () => {
    for (const trip of trips) {
      await prisma.trip.delete({ where: { id: trip.id } }).catch(() => {});
    }
    for (const user of users) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });
}); 