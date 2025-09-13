import { PrismaClient } from '@prisma/client';
import MboxClient from '@mapbox/mapbox-sdk';
import Directions from '@mapbox/mapbox-sdk/services/directions';
import Matching from '@mapbox/mapbox-sdk/services/map-matching';
import polyline from '@mapbox/polyline'; // For decoding polylines
import * as h3 from 'h3-js';

const prisma = new PrismaClient();
const mapboxClient = MboxClient({ accessToken: process.env.MAPBOX_ACCESS_TOKEN! });
const directionsService = Directions(mapboxClient);
const matchingService = Matching(mapboxClient);

export async function createTrip(tripData: any) {
  const { userId, origin, destination, seatsRequired, seatsOffered, departureTime } = tripData;


  const directionsResponse = await directionsService.getDirections({
    profile: 'driving-traffic',
    waypoints: [{ coordinates: origin }, { coordinates: destination }],
    geometries: 'polyline6', 
  }).send();
  
  const route = directionsResponse.body.routes[0];
  const rawPolyline = route.geometry; 


  const decodedPath = polyline.decode(rawPolyline, 6).map(coord => [coord[1], coord[0]]); // Decode to [lng, lat]
  const matchingResponse = await matchingService.getMatch({
    profile: 'driving-traffic',
    points: decodedPath.map(p => ({ coordinates: p as [number, number] })),
    geometries: 'polyline6',
  }).send();

  const matchedRoute = matchingResponse.body.matchings[0];
  const snappedPolylineEncoded = matchedRoute.geometry;


  const snappedPathDecoded = polyline.decode(snappedPolylineEncoded, 6); // Decode to [lat, lng]
  const h3Resolution = 9; // ~175m edge length
  const h3Cells = h3.polygonToCells(snappedPathDecoded, h3Resolution);

  // 4. Save to Database
  const newTrip = await prisma.trip.create({
    data: {
      userId,
      departureTime,
      seatsRequired,
      seatsOffered,
      snappedPolyline: snappedPolylineEncoded,
      routeLengthM: matchedRoute.distance,
      h3Cells: h3Cells.map(String),
    },
  });

  return newTrip;
}
