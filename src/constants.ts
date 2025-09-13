/**
 * The proximity threshold in meters for considering two trips close enough for a match.
 */
export const PROXIMITY_THRESHOLD_METERS = 175;

/**
 * The proximity threshold in degrees, converted from meters.
 * Approx. 1 degree of latitude is 111km.
 */
export const PROXIMITY_THRESHOLD_DEGREES = PROXIMITY_THRESHOLD_METERS / 111000;

/**
 * The H3 resolution used for spatial indexing.
 * Resolution 9 has an average edge length of ~175m.
 */
export const H3_RESOLUTION = 9;

/**
 * The minimum required polyline overlap percentage for a valid match.
 */
export const MIN_POLYLINE_OVERLAP_PERCENTAGE = 20;

/**
 * The maximum allowed route deviation percentage for a valid match.
 */
export const MAX_DEVIATION_PERCENTAGE = 30;
