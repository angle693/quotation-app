// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import quotationRoutes from './routes/quotationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing in .env');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  })
);
app.use(express.json());

// Fallback rates
const DEFAULT_RATES = {
  'Duraflame Semiwaterproof 303': { '19MM': 67, '12MM': 50, '9MM': 42, '6MM': 32 },
  'Durbi Semiwaterproof 303': { '19MM': 77, '12MM': 56, '9MM': 46.5, '6MM': 35 },
  'Nocte Semiwaterproof 303': { '19MM': 80, '12MM': 59, '9MM': 49.5, '6MM': 38.5 },
  'Nocte Waterproof 710': { '19MM': 95, '12MM': 66, '9MM': 56, '6MM': 46 },
};

app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Backend is running!' });
});

app.get('/api/rates', (req, res) => {
  res.json(DEFAULT_RATES);
});

app.use('/api/quotations', quotationRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});