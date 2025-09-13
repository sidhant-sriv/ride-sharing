import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function findMatches(tripId: string) {
  const newTrip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!newTrip) throw new Error("Trip not found");

  const thirtyMinutes = 30 * 60 * 1000;
  const startTime = new Date(newTrip.departureTime.getTime() - thirtyMinutes);
  const endTime = new Date(newTrip.departureTime.getTime() + thirtyMinutes);

  // 1. & 2. Initial DB Query with Time, Seats, and H3 Prefilter
  const candidates = await prisma.trip.findMany({
    where: {
      id: { not: newTrip.id },
      status: 'pending',
      departureTime: { gte: startTime, lte: endTime },
      seatsOffered: { gte: newTrip.seatsRequired },
      h3Cells: {
        hasSome: newTrip.h3Cells, // Powerful Prisma feature for array overlap
      },
    },
  });
  
  // 3. Scoring & Ranking (Simplified for Phase 1)
  const scoredMatches = candidates.map(candidate => {
    const overlapCount = candidate.h3Cells.filter(cell => newTrip.h3Cells.includes(cell)).length;
    const score = (overlapCount / newTrip.h3Cells.length) * 100;
    return { trip: candidate, score };
  });

  // Sort by the best score
  scoredMatches.sort((a, b) => b.score - a.score);

  return scoredMatches;
}
