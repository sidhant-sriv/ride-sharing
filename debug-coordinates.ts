import { calculateDistance } from './src/utils';

// Trip A coordinates
const tripA = {
  pickup: { lat: 12.902819754133755, lng: 77.67510455869504 },
  dropOff: { lat: 12.905852257601506, lng: 77.64882508835207 }
};

// Trip B coordinates  
const tripB = {
  pickup: { lat: 12.91166687264877, lng: 77.67624545824033 },
  dropOff: { lat: 12.908934647787344, lng: 77.64882722904318 }
};

console.log('=== COORDINATE ANALYSIS ===');
console.log('Trip A Pickup:', tripA.pickup);
console.log('Trip B Pickup:', tripB.pickup);

const pickupDistance = calculateDistance(
  tripA.pickup.lat, tripA.pickup.lng,
  tripB.pickup.lat, tripB.pickup.lng
);

console.log(`Pickup distance: ${pickupDistance.toFixed(2)} meters`);
console.log(`Proximity threshold: 500 meters`);
console.log(`Within threshold: ${pickupDistance <= 500 ? 'YES' : 'NO'}`);

console.log('\nTrip A Drop-off:', tripA.dropOff);
console.log('Trip B Drop-off:', tripB.dropOff);

const dropOffDistance = calculateDistance(
  tripA.dropOff.lat, tripA.dropOff.lng,
  tripB.dropOff.lat, tripB.dropOff.lng
);

console.log(`Drop-off distance: ${dropOffDistance.toFixed(2)} meters`);
