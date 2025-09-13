import polyline from '@mapbox/polyline';

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @param lat1 Latitude of the first point.
 * @param lng1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lng2 Longitude of the second point.
 * @returns The distance in meters.
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Calculates the percentage of overlap between two polylines.
 * @param polyline1 The first polyline string.
 * @param polyline2 The second polyline string.
 * @returns The overlap percentage.
 */
export function calculatePolylineOverlap(polyline1: string, polyline2: string): number {
    try {
      const coords1 = polyline.decode(polyline1);
      const coords2 = polyline.decode(polyline2);
      
      if (coords1.length === 0 || coords2.length === 0) return 0;
      
      let overlapCount = 0;
      const threshold = 200; // meters
      
      for (const point1 of coords1) {
        for (const point2 of coords2) {
          const distance = calculateDistance(point1[0], point1[1], point2[0], point2[1]);
          if (distance <= threshold) {
            overlapCount++;
            break;
          }
        }
      }
      
      return (overlapCount / coords1.length) * 100;
    } catch (error) {
      console.error('Error calculating polyline overlap:', error);
      return 0;
    }
}

/**
 * Ensures a canonical ordering of trip IDs for a match.
 * @param tripAId The ID of the first trip.
 * @param tripBId The ID of the second trip.
 * @returns A tuple with trip IDs in canonical order.
 */
export function getCanonicalTripIds(tripAId: string, tripBId: string): [string, string] {
    return tripAId < tripBId ? [tripAId, tripBId] : [tripBId, tripAId];
}
