import { describe, test, expect, afterAll, beforeAll } from 'bun:test';
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
  if (!res.ok) {
    console.error('Failed to create user:', await res.text());
    throw new Error('Failed to create user');
  }
  return res.json();
}

// Helper function to create a trip
async function createTrip(tripData: any) {
  const res = await fetch(`${API_URL}/trips`, {
    method: 'POST',
    body: JSON.stringify(tripData),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    console.error('Failed to create trip:', await res.text());
    throw new Error('Failed to create trip');
  }
  return res.json();
}

// Helper to parse time strings like "5:30pm" into future Date objects
function parseTime(timeStr: string): Date {
    const today = new Date();
    const [time, modifier] = timeStr.split(/(am|pm)/i);
    let [hours, minutes] = time.split(':').map(Number);
  
    if (modifier && modifier.toLowerCase() === 'pm' && hours < 12) {
      hours += 12;
    }
    if (modifier && modifier.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }
  
    today.setHours(hours, minutes, 0, 0);
  
    // If the parsed time is in the past, schedule it for the next day
    if (today.getTime() < Date.now()) {
        today.setDate(today.getDate() + 1);
    }
    
    return today;
}


describe('Specific Match Scenario Tests', () => {
  const users: any[] = [];
  const trips: any[] = [];

  beforeAll(async () => {
    // Clean up old data before this test run
    await prisma.match.deleteMany({});
    await prisma.trip.deleteMany({});
    await prisma.user.deleteMany({});
  });

  test('should match Trip A and Trip B, and not others', async () => {
    // 1. Define test data
    const testData = [
      { name: 'A', pickup: [12.902819, 77.675104], dropOff: [12.905852, 77.648825], time: '5:30pm', isDriver: true },
      // Trip B is now ~150m away from Trip A
      { name: 'B', pickup: [12.903900, 77.674500], dropOff: [12.908934, 77.648827], time: '5:30pm' },
      { name: 'C', pickup: [12.902840, 77.675083], dropOff: [12.912047, 77.638847], time: '6:30pm' },
      { name: 'D', pickup: [12.903614, 77.527222], dropOff: [12.978221, 77.595079], time: '5:45pm' },
      { name: 'E', pickup: [12.919970, 77.691845], dropOff: [12.969325, 77.641523], time: '7:30pm' },
      { name: 'F', pickup: [12.979808, 77.590718], dropOff: [12.994445, 77.728798], time: '5:45pm' },
      { name: 'G', pickup: [12.971830, 77.595872], dropOff: [13.027392, 77.567546], time: '6:00pm' },
    ];

    // 2. Create users for each trip
    for (const data of testData) {
      const user = await createUser(`User ${data.name}`, `+55555555${data.name.charCodeAt(0)}`);
      users.push(user);
    }

    // 3. Create trips for each user
    let driverTripId = '';
    let riderTripBId = '';
    for (let i = 0; i < testData.length; i++) {
        const data = testData[i];
        const user = users[i];
        const tripPayload = {
            driverId: user.id,
            pickup: { lat: data.pickup[0], lng: data.pickup[1] },
            dropOff: { lat: data.dropOff[0], lng: data.dropOff[1] },
            departureTime: parseTime(data.time).toISOString(),
            seatsOffered: data.isDriver ? 3 : 0,
            seatsRequired: data.isDriver ? 0 : 1,
        };
        const trip = await createTrip(tripPayload);
        trips.push(trip);
        if (data.name === 'A') driverTripId = trip.id;
        if (data.name === 'B') riderTripBId = trip.id;
    }

    // 4. Find matches for the driver trip (Trip A)
    const matchesRes = await fetch(`${API_URL}/matches/${driverTripId}`);
    expect(matchesRes.ok).toBe(true);
    const matches = await matchesRes.json();
    
    // 5. Assert the results
    expect(matches.length).toBe(1); // Should only match with Trip B
    expect(matches[0].matchingTripId).toBe(riderTripBId);

  }, 30000); // 30 second timeout for this test

  // afterAll(async () => {
  //   // Cleanup has been disabled to allow for data inspection
  //   for (const trip of trips) {
  //     await prisma.trip.delete({ where: { id: trip.id } }).catch(() => {});
  //   }
  //   for (const user of users) {
  //     await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  //   }
  //   await prisma.$disconnect();
  // });
});
