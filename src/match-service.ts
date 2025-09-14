import { PrismaClient } from '@prisma/client';
import MapboxClient from '@mapbox/mapbox-sdk';
import Directions from '@mapbox/mapbox-sdk/services/directions';
import { calculateDistance, calculatePolylineOverlap, getCanonicalTripIds } from './utils';
import { 
    PROXIMITY_THRESHOLD_METERS, 
    PROXIMITY_THRESHOLD_DEGREES,
    MIN_POLYLINE_OVERLAP_PERCENTAGE,
    MAX_DEVIATION_PERCENTAGE
} from './constants';
import type { MatchStatusType } from './types';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
const mapboxClient = MapboxClient({ accessToken: process.env.MAPBOX_ACCESS_TOKEN! });
const directionsService = Directions(mapboxClient);

async function getRouteDetails(tripId: string) {
  logger.info(` [DB] Looking up trip details for: ${tripId}`);
  let trip = await prisma.trip.findUnique({ 
    where: { id: tripId },
    include: { driver: true }
  });
  if (!trip) throw new Error("Trip not found");

  logger.info(`[TRIP] Found trip from ${trip.driver.fullName} (${trip.pickupLat}, ${trip.pickupLng}) → (${trip.dropOffLat}, ${trip.dropOffLng})`);

  if (!trip.polyline || !trip.routeLengthM) {
    logger.info(`[MAPBOX] Route not cached, fetching from Mapbox API...`);
    try {
      const requestPayload = {
        profile: 'driving-traffic' as const,
        waypoints: [
          { coordinates: [Number(trip.pickupLng), Number(trip.pickupLat)] as [number, number] },
          { coordinates: [Number(trip.dropOffLng), Number(trip.dropOffLat)] as [number, number] }
        ],
        geometries: 'polyline6' as const,
      };
      logger.debug(`[MAPBOX] API Request:`, JSON.stringify(requestPayload, null, 2));

      const response = await directionsService.getDirections(requestPayload).send();
      const route = response.body.routes[0];
      
      logger.info(` [MAPBOX] API Response: ${route.distance}m, ${route.duration}s`);
      logger.info(` [DB] Caching route data for trip ${tripId}`);
      
      trip = await prisma.trip.update({
        where: { id: tripId },
        data: {
          polyline: route.geometry,
          routeLengthM: route.distance,
          routeDurationS: route.duration,
        },
        include: { driver: true }
      });
      logger.info(` [DB] Route cached successfully`);
    } catch (error) {
      logger.error(' [MAPBOX] Error fetching route:', error);
      throw new Error('Failed to fetch route details');
    }
  } else {
    logger.info(` [CACHE] Using cached route data: ${trip.routeLengthM}m`);
  }
  return trip;
}

async function upsertMatch(tripAId: string, tripBId: string, matchScore: number) {
  const [canonicalTripAId, canonicalTripBId] = getCanonicalTripIds(tripAId, tripBId);

  await prisma.match.upsert({
    where: {
      tripAId_tripBId: {
        tripAId: canonicalTripAId,
        tripBId: canonicalTripBId
      }
    },
    update: { matchScore, updatedAt: new Date() },
    create: {
      tripAId: canonicalTripAId,
      tripBId: canonicalTripBId,
      matchScore,
      status: 'proposed'
    }
  });
}

export async function findMatchesForTrip(tripId: string) {
  logger.info(`\n [MATCHING] Starting match search for trip: ${tripId}`);
  
  logger.info(` [STEP 1] Fetching main trip details...`);
  const newTrip = await getRouteDetails(tripId);

  logger.info(` [STEP 2] Pre-filtering candidates from database...`);
  const thirtyMinutes = 30 * 60 * 1000;
  const startTime = new Date(newTrip.departureTime.getTime() - thirtyMinutes);
  const endTime = new Date(newTrip.departureTime.getTime() + thirtyMinutes);

  logger.debug(` [FILTER] Time window: ${startTime.toISOString()} to ${endTime.toISOString()}`);
  logger.debug(` [FILTER] Bounding box: ${PROXIMITY_THRESHOLD_DEGREES.toFixed(4)} degrees`);

  const allPotentialTrips = await prisma.trip.findMany({
    where: {
      id: { not: newTrip.id },
      status: 'pending',
      departureTime: { gte: startTime, lte: endTime },
      seatsOffered: { gte: newTrip.seatsRequired },
      seatsRequired: { lte: newTrip.seatsOffered },
      pickupLat: { gte: newTrip.pickupLat - PROXIMITY_THRESHOLD_DEGREES, lte: newTrip.pickupLat + PROXIMITY_THRESHOLD_DEGREES },
      pickupLng: { gte: newTrip.pickupLng - PROXIMITY_THRESHOLD_DEGREES, lte: newTrip.pickupLng + PROXIMITY_THRESHOLD_DEGREES },
    },
    include: { driver: true }
  });

  logger.info(` [DB] Found ${allPotentialTrips.length} potential candidates`);

  logger.info(` [STEP 2.5] Filtering candidates within ${PROXIMITY_THRESHOLD_METERS}m...`);
  const tripsWithinProximity = allPotentialTrips.filter(candidate => {
    const distance = calculateDistance(
      newTrip.pickupLat,
      newTrip.pickupLng,
      candidate.pickupLat,
      candidate.pickupLng
    );
    return distance <= PROXIMITY_THRESHOLD_METERS;
  });
  logger.info(` [FILTER] Found ${tripsWithinProximity.length} candidates within proximity`);

  logger.info(` [STEP 3] Starting detailed analysis with Mapbox...`);
  const validMatches = [];

  for (let i = 0; i < tripsWithinProximity.length; i++) {
    const candidate = tripsWithinProximity[i];
    logger.info(`\n [CANDIDATE ${i + 1}/${tripsWithinProximity.length}] Analyzing trip ${candidate.id} from ${candidate.driver.fullName}`);
    
    try {
      logger.info(`    Getting candidate route details...`);
      const candidateTrip = await getRouteDetails(candidate.id);

      logger.info(`    Calculating polyline overlap...`);
      const overlapPercentage = calculatePolylineOverlap(newTrip.polyline!, candidateTrip.polyline!);
      logger.debug(`    Overlap: ${overlapPercentage.toFixed(2)}%`);
      
      if (overlapPercentage < MIN_POLYLINE_OVERLAP_PERCENTAGE) {
        logger.debug(`    Skipping: overlap ${overlapPercentage.toFixed(2)}% < ${MIN_POLYLINE_OVERLAP_PERCENTAGE}% threshold`);
        continue;
      }

      logger.info(`    Calculating route deviation...`);
      const combinedWaypoints: { coordinates: [number, number] }[] = [
        { coordinates: [Number(newTrip.pickupLng), Number(newTrip.pickupLat)] },
        { coordinates: [Number(candidateTrip.pickupLng), Number(candidateTrip.pickupLat)] },
        { coordinates: [Number(candidateTrip.dropOffLng), Number(candidateTrip.dropOffLat)] },
        { coordinates: [Number(newTrip.dropOffLng), Number(newTrip.dropOffLat)] },
      ];
      logger.debug(`    [MAPBOX] Combined route API request with ${combinedWaypoints.length} waypoints`);

      const combinedRouteResponse = await directionsService.getDirections({
        profile: 'driving-traffic',
        waypoints: combinedWaypoints,
      }).send();

      const combinedRoute = combinedRouteResponse.body.routes[0];
      const combinedDistance = combinedRoute.distance;
      const combinedDuration = combinedRoute.duration;
      const extraDistance = combinedDistance - newTrip.routeLengthM!;
      const deviationPercentage = (extraDistance / newTrip.routeLengthM!) * 100;

      logger.info(`[MAPBOX] Combined route: ${combinedDistance}m (+${extraDistance}m), ${combinedDuration}s`);
      logger.debug(`Deviation: ${deviationPercentage.toFixed(2)}%`);

      if (deviationPercentage <= MAX_DEVIATION_PERCENTAGE) {
        const matchScore = (0.7 * overlapPercentage) + (0.3 * (100 - deviationPercentage));
        logger.info(`   Match score: ${matchScore.toFixed(2)}% (overlap: 70%, deviation: 30%)`);
        
        logger.info(`   [DB] Storing match in database...`);
        await upsertMatch(newTrip.id, candidateTrip.id, matchScore);

        const originalDuration = newTrip.routeDurationS!; 
        const additionalTimeSeconds = combinedDuration - originalDuration;
        validMatches.push({
          trip: candidateTrip,
          overlapPercentage: overlapPercentage,
          deviationPercentage: deviationPercentage,
          additionalDistanceMeters: extraDistance,
          additionalTimeSeconds: additionalTimeSeconds,
          matchScore: matchScore
        });
        logger.info(`   Valid match found and stored!`);
      } else {
        logger.debug(`   Rejected: deviation ${deviationPercentage.toFixed(2)}% > ${MAX_DEVIATION_PERCENTAGE}% threshold`);
      }
    } catch (error) {
      logger.error(`   Error processing candidate trip ${candidate.id}:`, error);
    }
  }

  logger.info(`\n[ANALYSIS] Completed analysis. Found ${validMatches.length} valid matches`);

  const rankedMatches = validMatches.map(match => ({
    matchingTripId: match.trip.id,
    matchPercentage: parseFloat(match.matchScore.toFixed(2)),
    overlapPercentage: parseFloat(match.overlapPercentage.toFixed(2)),
    additionalDistanceMeters: Math.round(match.additionalDistanceMeters),
    additionalTimeSeconds: Math.round(match.additionalTimeSeconds),
    trip: {
      id: match.trip.id,
      driverId: match.trip.driverId,
      driverName: match.trip.driver.fullName,
      departureTime: match.trip.departureTime,
      seatsOffered: match.trip.seatsOffered,
      pickup: { lat: match.trip.pickupLat, lng: match.trip.pickupLng },
      dropOff: { lat: match.trip.dropOffLat, lng: match.trip.dropOffLng },
    }
  }));

  rankedMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

  return rankedMatches;
}

export async function getExistingMatches(tripId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { tripAId: tripId },
        { tripBId: tripId }
      ],
      status: { in: ['proposed', 'accepted'] }
    },
    include: {
      tripA: { include: { driver: true } },
      tripB: { include: { driver: true } }
    },
    orderBy: { matchScore: 'desc' }
  });

  return matches.map((match: any) => {
    const otherTrip = match.tripAId === tripId ? match.tripB : match.tripA;
    
    return {
      matchId: match.id,
      matchingTripId: otherTrip.id,
      matchPercentage: match.matchScore,
      status: match.status,
      trip: {
        id: otherTrip.id,
        driverId: otherTrip.driverId,
        driverName: otherTrip.driver.fullName,
        departureTime: otherTrip.departureTime,
        seatsOffered: otherTrip.seatsOffered,
        pickup: { lat: otherTrip.pickupLat, lng: otherTrip.pickupLng },
        dropOff: { lat: otherTrip.dropOffLat, lng: otherTrip.dropOffLng },
      }
    };
  });
}

export async function updateMatchStatus(matchId: string, status: MatchStatusType) {
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { 
      status: status,
      updatedAt: new Date()
    },
    include: {
      tripA: true,
      tripB: true
    }
  });

  if (status === 'accepted') {
    await prisma.trip.updateMany({
      where: {
        id: { in: [match.tripAId, match.tripBId] }
      },
      data: {
        status: 'matched',
        updatedAt: new Date()
      }
    });
  }

  return match;
}

export async function invalidateAndRematch(tripId: string, isDeletion: boolean = false) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ tripAId: tripId }, { tripBId: tripId }],
      status: 'accepted',
    },
    include: {
      tripA: true,
      tripB: true,
    }
  });

  for (const match of matches) {
    const otherTripId = match.tripAId === tripId ? match.tripBId : match.tripAId;
    
    logger.info(`Notifying user of trip ${otherTripId} that their match has been ${isDeletion ? 'cancelled' : 'changed'}.`);

    await prisma.trip.update({
      where: { id: otherTripId },
      data: { status: 'pending' },
    });
  }

  await prisma.match.deleteMany({
    where: {
      OR: [{ tripAId: tripId }, { tripBId: tripId }],
    }
  });

  if (!isDeletion) {
    findMatchesForTrip(tripId);
  }
}

export async function findMatches(tripId: string) {
  return findMatchesForTrip(tripId);
}