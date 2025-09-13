import { PrismaClient } from '@prisma/client';
import MboxClient from '@mapbox/mapbox-sdk';
import Directions from '@mapbox/mapbox-sdk/services/directions';
import Matching from '@mapbox/mapbox-sdk/services/map-matching';
import polyline from '@mapbox/polyline';
import * as h3 from 'h3-js';
import { invalidateAndRematch } from './match-service';

const prisma = new PrismaClient();
const mapboxClient = MboxClient({ accessToken: process.env.MAPBOX_ACCESS_TOKEN! });
const directionsService = Directions(mapboxClient);
const matchingService = Matching(mapboxClient);

export async function createTrip(tripData: any) {
  console.log(`\n[TRIP CREATION] Starting trip creation...`);
  const { 
    driverId, 
    pickup, 
    dropOff, 
    seatsOffered, 
    seatsRequired,
    departureTime 
  } = tripData;

  console.log(`[INPUT] Driver: ${driverId}, Seats Offered: ${seatsOffered}, Seats Required: ${seatsRequired}, Departure: ${departureTime}`);
  console.log(`[ROUTE] ${pickup.lat}, ${pickup.lng} → ${dropOff.lat}, ${dropOff.lng}`);

  // Validate required fields
  if (!driverId || !pickup || !dropOff || !departureTime) {
    throw new Error('Missing required fields: driverId, pickup, dropOff, departureTime');
  }

  // Validate pickup and dropOff have lat/lng
  if (!pickup.lat || !pickup.lng || !dropOff.lat || !dropOff.lng) {
    throw new Error('Pickup and dropOff must have lat and lng properties');
  }

  // Get directions from Mapbox
  console.log(`[MAPBOX] Fetching directions...`);
  const directionsPayload = {
    profile: 'driving-traffic' as const,
    waypoints: [
      { coordinates: [Number(pickup.lng), Number(pickup.lat)] as [number, number] },
      { coordinates: [Number(dropOff.lng), Number(dropOff.lat)] as [number, number] }
    ],
    geometries: 'polyline6' as const,
  };
  console.log(`[MAPBOX] Directions API request:`, JSON.stringify(directionsPayload, null, 2));

  const directionsResponse = await directionsService.getDirections(directionsPayload).send();
  
  const route = directionsResponse.body.routes[0];
  const rawPolyline = route.geometry; 
  console.log(`[MAPBOX] Directions response: ${route.distance}m, ${route.duration}s`);

  // Map-match the route to get snapped polyline
  console.log(`[MAPBOX] Map-matching for precise route snapping...`);
  const decodedPath = polyline.decode(rawPolyline, 6).map(coord => [coord[1], coord[0]]); // Decode to [lng, lat]
  console.log(`[DECODE] Decoded ${decodedPath.length} path points`);

  const matchingPayload = {
    profile: 'driving-traffic' as const,
    points: decodedPath.map(p => ({ coordinates: p as [number, number] })),
    geometries: 'polyline6' as const,
  };
  console.log(`[MAPBOX] Map-matching API request with ${decodedPath.length} points`);

  const matchingResponse = await matchingService.getMatch(matchingPayload).send();

  const matchedRoute = matchingResponse.body.matchings[0];
  const snappedPolylineEncoded = matchedRoute.geometry;
  console.log(`[MAPBOX] Map-matched route: ${matchedRoute.distance}m, confidence: ${matchedRoute.confidence}`);

  // Generate H3 cells for spatial indexing (optional - kept for backward compatibility)
  console.log(`[H3] Generating spatial index cells...`);
  const snappedPathDecoded = polyline.decode(snappedPolylineEncoded, 6); // Decode to [lat, lng]
  const h3Resolution = 9; // ~175m edge length
  const h3Cells = h3.polygonToCells(snappedPathDecoded, h3Resolution);
  console.log(`[H3] Generated ${h3Cells.length} H3 cells at resolution ${h3Resolution}`);

  // Create the trip in the database
  console.log(`[DB] Saving trip to database...`);
  const newTrip = await prisma.trip.create({
    data: {
      driverId,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropOffLat: dropOff.lat,
      dropOffLng: dropOff.lng,
      departureTime: new Date(departureTime),
      seatsOffered,
      seatsRequired,
      polyline: snappedPolylineEncoded,
      routeLengthM: matchedRoute.distance,
      routeDurationS: matchedRoute.duration,
      status: 'pending'
    },
    include: {
      driver: true
    }
  });

  console.log(`[DB] Trip created successfully: ${newTrip.id}`);
  console.log(`[TRIP CREATION] Completed!`);

  return newTrip;
}

// Function to get trip details
export async function getTripById(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      driver: true,
      matchesAsA: {
        include: {
          tripB: { include: { driver: true } }
        }
      },
      matchesAsB: {
        include: {
          tripA: { include: { driver: true } }
        }
      }
    }
  });

  if (!trip) {
    throw new Error('Trip not found');
  }

  return trip;
}

// Function to update trip status
export async function updateTripStatus(tripId: string, status: string) {
  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: { 
      status: status as any,
      updatedAt: new Date()
    },
    include: {
      driver: true
    }
  });

  return trip;
}

// Function to get trips by driver
export async function getTripsByDriver(driverId: string) {
  const trips = await prisma.trip.findMany({
    where: { driverId },
    include: {
      driver: true,
      matchesAsA: {
        include: {
          tripB: { include: { driver: true } }
        }
      },
      matchesAsB: {
        include: {
          tripA: { include: { driver: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return trips;
}

export async function updateTrip(tripId: string, tripData: any) {
  const { pickup, dropOff, departureTime, seatsOffered, seatsRequired } = tripData;

  // Check if core fields have changed
  const originalTrip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!originalTrip) throw new Error('Trip not found');

  const hasCoreChange = 
    (pickup && (pickup.lat !== originalTrip.pickupLat || pickup.lng !== originalTrip.pickupLng)) ||
    (dropOff && (dropOff.lat !== originalTrip.dropOffLat || dropOff.lng !== originalTrip.dropOffLng)) ||
    (departureTime && new Date(departureTime).toISOString() !== originalTrip.departureTime.toISOString());

  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      pickupLat: pickup?.lat,
      pickupLng: pickup?.lng,
      dropOffLat: dropOff?.lat,
      dropOffLng: dropOff?.lng,
      departureTime: departureTime ? new Date(departureTime) : undefined,
      seatsOffered,
      seatsRequired,
      updatedAt: new Date(),
    }
  });

  if (hasCoreChange) {
    await invalidateAndRematch(tripId);
  }

  return updatedTrip;
}

export async function deleteTrip(tripId: string) {
  // Invalidate matches and notify users before deleting
  await invalidateAndRematch(tripId, true);

  await prisma.trip.delete({ where: { id: tripId } });
}