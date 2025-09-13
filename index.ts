import express, { type Express, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import userRoutes from './src/routes/user-routes';
import tripRoutes from './src/routes/trip-routes';
import matchRoutes from './src/routes/match-routes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API routes
app.use('/users', userRoutes);
app.use('/trips', tripRoutes);
app.use('/matches', matchRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});