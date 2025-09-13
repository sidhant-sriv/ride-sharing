import { TripStatus, MatchStatus } from '@prisma/client';

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface CreateTripInput {
    driverId: string;
    pickup: Coordinates;
    dropOff: Coordinates;
    seatsOffered: number;
    seatsRequired: number;
    departureTime: string | Date;
}

export interface UpdateTripInput {
    pickup?: Coordinates;
    dropOff?: Coordinates;
    departureTime?: string | Date;
    seatsOffered?: number;
    seatsRequired?: number;
}

export type TripStatusType = TripStatus;
export type MatchStatusType = MatchStatus;
