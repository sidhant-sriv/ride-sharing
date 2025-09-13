import { Router, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createTrip, getTripById, updateTripStatus, getTripsByDriver, updateTrip, deleteTrip } from '../trip-service';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const newTrip = await createTrip(req.body);
    res.status(201).json(newTrip);
  } catch (error: any) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const trip = await getTripById(req.params.id);
    res.status(200).json(trip);
  } catch (error: any) {
    console.error('Error fetching trip:', error);
    res.status(404).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const trip = await updateTrip(req.params.id, req.body);
    res.status(200).json(trip);
  } catch (error: any) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await deleteTrip(req.params.id);
    res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const trip = await updateTripStatus(req.params.id, status);
    res.status(200).json(trip);
  } catch (error: any) {
    console.error('Error updating trip status:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/driver/:driverId', async (req: Request, res: Response) => {
  try {
    const trips = await getTripsByDriver(req.params.driverId);
    res.status(200).json(trips);
  } catch (error: any) {
    console.error('Error fetching driver trips:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
