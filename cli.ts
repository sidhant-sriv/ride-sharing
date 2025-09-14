import inquirer from 'inquirer';
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from './src/user-service';
import { 
  createTrip, 
  getTripById, 
  getTripsByDriver, 
  updateTripStatus, 
  updateTrip, 
  deleteTrip 
} from './src/trip-service';
import { 
  findMatches, 
  getExistingMatches, 
  updateMatchStatus 
} from './src/match-service';
import { TripStatus, MatchStatus } from '@prisma/client';
import * as chrono from 'chrono-node';

const mainMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Manage Users',
        'Manage Trips',
        'Manage Matches',
        new inquirer.Separator(),
        'Exit',
      ],
    },
  ]);

  switch (action) {
    case 'Manage Users':
      await userMenu();
      break;
    case 'Manage Trips':
      await tripMenu();
      break;
    case 'Manage Matches':
      await matchMenu();
      break;
    case 'Exit':
      console.log('Goodbye!');
      process.exit(0);
  }
};

const userMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'User Management',
      choices: [
        'Create User',
        'View All Users',
        'View User by ID',
        'Update User',
        'Delete User',
        new inquirer.Separator(),
        'Back to Main Menu',
      ],
    },
  ]);

  switch (action) {
    case 'Create User':
      await handleCreateUser();
      break;
    case 'View All Users':
      await handleGetAllUsers();
      break;
    case 'View User by ID':
      await handleGetUserById();
      break;
    case 'Update User':
      await handleUpdateUser();
      break;
    case 'Delete User':
      await handleDeleteUser();
      break;
    case 'Back to Main Menu':
      await mainMenu();
      return;
  }
  await userMenu();
};

const tripMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Trip Management',
      choices: [
        'Create Trip',
        'View Trip by ID',
        'View Trips by Driver',
        'Update Trip Status',
        'Update Trip',
        'Delete Trip',
        new inquirer.Separator(),
        'Back to Main Menu',
      ],
    },
  ]);

  switch (action) {
    case 'Create Trip':
      await handleCreateTrip();
      break;
    case 'View Trip by ID':
        await handleGetTripById();
        break;
    case 'View Trips by Driver':
        await handleGetTripsByDriver();
        break;
    case 'Update Trip Status':
        await handleUpdateTripStatus();
        break;
    case 'Update Trip':
        await handleUpdateTrip();
        break;
    case 'Delete Trip':
        await handleDeleteTrip();
        break;
    case 'Back to Main Menu':
        await mainMenu();
        return;
  }
  await tripMenu();
};

const matchMenu = async () => {
    const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Match Management',
          choices: [
            'Find Matches for a Trip',
            'View Existing Matches for a Trip',
            'Update Match Status',
            new inquirer.Separator(),
            'Back to Main Menu',
          ],
        },
      ]);
    
      switch (action) {
        case 'Find Matches for a Trip':
            await handleFindMatches();
            break;
        case 'View Existing Matches for a Trip':
            await handleGetExistingMatches();
            break;
        case 'Update Match Status':
            await handleUpdateMatchStatus();
            break;
        case 'Back to Main Menu':
            await mainMenu();
            return;
      }
      await matchMenu();
};

// User handlers
const handleCreateUser = async () => {
    const answers = await inquirer.prompt([
        { type: 'input', name: 'fullName', message: 'Full Name:' },
        { type: 'input', name: 'email', message: 'Email:' },
        { type: 'input', name: 'phoneNumber', message: 'Phone:' },
      ]);
      try {
        const newUser = await createUser(answers);
        console.log('User created successfully:', newUser);
      } catch (error) {
        console.error('Error creating user:', (error as Error).message);
      }
};

const handleGetAllUsers = async () => {
    try {
        const users = await getAllUsers();
        console.log('All Users:');
        console.table(users);
      } catch (error) {
        console.error('Error getting users:', (error as Error).message);
      }
};

const handleGetUserById = async () => {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message: 'Enter User ID:' }]);
    try {
      const user = await getUserById(id);
      if (user) {
        console.log('User found:', user);
      } else {
        console.log('User not found.');
      }
    } catch (error) {
      console.error('Error finding user:', (error as Error).message);
    }
};

const handleUpdateUser = async () => {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message: 'Enter User ID to update:' }]);
    const answers = await inquirer.prompt([
        { type: 'input', name: 'fullName', message: 'Full Name (leave blank to keep current):' },
        { type: 'input', name: 'email', message: 'Email (leave blank to keep current):' },
        { type: 'input', name: 'phoneNumber', message: 'Phone (leave blank to keep current):' },
    ]);

    const updateData: { [key: string]: string } = {};
    if (answers.fullName) updateData.fullName = answers.fullName;
    if (answers.email) updateData.email = answers.email;
    if (answers.phoneNumber) updateData.phoneNumber = answers.phoneNumber;

    if (Object.keys(updateData).length === 0) {
        console.log("No changes provided.");
        return;
    }

    try {
        const updatedUser = await updateUser(id, updateData);
        console.log('User updated successfully:', updatedUser);
    } catch (error) {
        console.error('Error updating user:', (error as Error).message);
    }
};

const handleDeleteUser = async () => {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message: 'Enter User ID to delete:' }]);
    try {
        await deleteUser(id);
        console.log('User deleted successfully.');
    } catch (error) {
        console.error('Error deleting user:', (error as Error).message);
    }
};

// Trip handlers
const handleCreateTrip = async () => {
    const users = await getAllUsers();
    const userChoices = users.map(user => ({ name: `${user.fullName} (${user.id})`, value: user.id }));

    const answers = await inquirer.prompt([
        { type: 'list', name: 'driverId', message: 'Select Driver:', choices: userChoices },
        { type: 'input', name: 'pickup', message: 'Pickup Location (lat,lng):' },
        { type: 'input', name: 'dropOff', message: 'DropOff Location (lat,lng):' },
        { type: 'number', name: 'seatsOffered', message: 'Seats Offered:' },
        { type: 'number', name: 'seatsRequired', message: 'Seats Required:' },
        { type: 'input', name: 'departureTime', message: 'Departure Time (e.g., "today at 5pm" or "2025-09-15 17:00"):' },
    ]);

    const pickupCoords = answers.pickup.split(',').map(s => parseFloat(s.trim()));
    const dropOffCoords = answers.dropOff.split(',').map(s => parseFloat(s.trim()));
    const departureTime = chrono.parseDate(answers.departureTime);

    if (pickupCoords.length !== 2 || dropOffCoords.length !== 2 || !departureTime) {
        console.error('Invalid input for location or time.');
        return;
    }

    const tripData = {
        driverId: answers.driverId,
        pickup: { lat: pickupCoords[0], lng: pickupCoords[1] },
        dropOff: { lat: dropOffCoords[0], lng: dropOffCoords[1] },
        seatsOffered: answers.seatsOffered,
        seatsRequired: answers.seatsRequired,
        departureTime: departureTime.toISOString(),
    };
    try {
        const newTrip = await createTrip(tripData);
        console.log('Trip created successfully:', newTrip);
    } catch (error) {
        console.error('Error creating trip:', (error as Error).message);
    }
};

const handleGetTripById = async () => {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message: 'Enter Trip ID:' }]);
    try {
        const trip = await getTripById(id);
        console.log('Trip details:', JSON.stringify(trip, null, 2));
    } catch (error) {
        console.error('Error getting trip:', (error as Error).message);
    }
};

const handleGetTripsByDriver = async () => {
    const users = await getAllUsers();
    const userChoices = users.map(user => ({ name: `${user.fullName} (${user.id})`, value: user.id }));
    const { driverId } = await inquirer.prompt([{ type: 'list', name: 'driverId', message: 'Select Driver:', choices: userChoices }]);
    try {
        const trips = await getTripsByDriver(driverId);
        console.log(`Trips for driver ${driverId}:`, JSON.stringify(trips, null, 2));
    } catch (error) {
        console.error('Error getting trips:', (error as Error).message);
    }
};

const handleUpdateTripStatus = async () => {
    const { tripId, status } = await inquirer.prompt([
        { type: 'input', name: 'tripId', message: 'Enter Trip ID:' },
        { type: 'list', name: 'status', message: 'Select new status:', choices: Object.values(TripStatus) }
    ]);
    try {
        const updatedTrip = await updateTripStatus(tripId, status);
        console.log('Trip status updated:', updatedTrip);
    } catch (error) {
        console.error('Error updating trip status:', (error as Error).message);
    }
};

const handleUpdateTrip = async () => {
    const { tripId } = await inquirer.prompt([{ type: 'input', name: 'tripId', message: 'Enter Trip ID to update:' }]);
    const answers = await inquirer.prompt([
        { type: 'input', name: 'pickup', message: 'New Pickup Location (lat,lng) (optional):' },
        { type: 'input', name: 'dropOff', message: 'New DropOff Location (lat,lng) (optional):' },
        { type: 'number', name: 'seatsOffered', message: 'New Seats Offered (optional):' },
        { type: 'number', name: 'seatsRequired', message: 'New Seats Required (optional):' },
        { type: 'input', name: 'departureTime', message: 'New Departure Time (optional, e.g., "tomorrow at 10am"):' },
    ]);

    const updateData: any = {};
    if (answers.pickup) {
        const pickupCoords = answers.pickup.split(',').map(s => parseFloat(s.trim()));
        if(pickupCoords.length === 2) updateData.pickup = { lat: pickupCoords[0], lng: pickupCoords[1] };
    }
    if (answers.dropOff) {
        const dropOffCoords = answers.dropOff.split(',').map(s => parseFloat(s.trim()));
        if(dropOffCoords.length === 2) updateData.dropOff = { lat: dropOffCoords[0], lng: dropOffCoords[1] };
    }
    if (answers.seatsOffered) updateData.seatsOffered = answers.seatsOffered;
    if (answers.seatsRequired) updateData.seatsRequired = answers.seatsRequired;
    if (answers.departureTime) {
        const departureTime = chrono.parseDate(answers.departureTime);
        if(departureTime) updateData.departureTime = departureTime.toISOString();
    }
    
    try {
        const updatedTrip = await updateTrip(tripId, updateData);
        console.log('Trip updated successfully:', updatedTrip);
    } catch (error) {
        console.error('Error updating trip:', (error as Error).message);
    }
};

const handleDeleteTrip = async () => {
    const { id } = await inquirer.prompt([{ type: 'input', name: 'id', message: 'Enter Trip ID to delete:' }]);
    try {
        await deleteTrip(id);
        console.log('Trip deleted successfully.');
    } catch (error) {
        console.error('Error deleting trip:', (error as Error).message);
    }
};

// Match handlers
const handleFindMatches = async () => {
    const { tripId } = await inquirer.prompt([{ type: 'input', name: 'tripId', message: 'Enter Trip ID to find matches for:' }]);
    try {
        const matches = await findMatches(tripId);
        console.log('Found matches:', JSON.stringify(matches, null, 2));
    } catch (error) {
        console.error('Error finding matches:', (error as Error).message);
    }
};

const handleGetExistingMatches = async () => {
    const { tripId } = await inquirer.prompt([{ type: 'input', name: 'tripId', message: 'Enter Trip ID to get existing matches for:' }]);
    try {
        const matches = await getExistingMatches(tripId);
        console.log('Existing matches:', JSON.stringify(matches, null, 2));
    } catch (error) {
        console.error('Error getting existing matches:', (error as Error).message);
    }
};

const handleUpdateMatchStatus = async () => {
    const { matchId, status } = await inquirer.prompt([
        { type: 'input', name: 'matchId', message: 'Enter Match ID:' },
        { type: 'list', name: 'status', message: 'Select new status:', choices: Object.values(MatchStatus) }
    ]);
    try {
        const updatedMatch = await updateMatchStatus(matchId, status);
        console.log('Match status updated:', updatedMatch);
    } catch (error) {
        console.error('Error updating match status:', (error as Error).message);
    }
};

mainMenu();
