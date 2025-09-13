import express, { type Express, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { createTrip } from './src/trip-service';
import { findMatches } from './src/match-service';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/trips', async (req: Request, res: Response) => {
  try {
    const newTrip = await createTrip(req.body);
    res.status(201).json(newTrip);
  } catch (error: any) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/trips/:id/matches', async (req: Request, res: Response) => {
  try {
    const matches = await findMatches(req.params.id);
    res.status(200).json(matches);
  } catch (error: any) {
    console.error('Error finding matches:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});