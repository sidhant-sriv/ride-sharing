import { Router, type Request, type Response } from 'express';
import { findMatchesForTrip, getExistingMatches, updateMatchStatus } from '../match-service';

const router = Router();

router.get('/:tripId', async (req: Request, res: Response) => {
  try {
    const matches = await findMatchesForTrip(req.params.tripId);
    res.status(200).json(matches);
  } catch (error: any) {
    console.error('Error finding matches:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/existing/:tripId', async (req: Request, res: Response) => {
  try {
    const matches = await getExistingMatches(req.params.tripId);
    res.status(200).json(matches);
  } catch (error: any) {
    console.error('Error fetching existing matches:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:matchId/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "accepted" or "rejected"' });
    }
    const match = await updateMatchStatus(req.params.matchId, status);
    res.status(200).json(match);
  } catch (error: any) {
    console.error('Error updating match status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
