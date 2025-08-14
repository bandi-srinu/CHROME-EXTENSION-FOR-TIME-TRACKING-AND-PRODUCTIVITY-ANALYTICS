import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Entry from './models/Entry.js';
import Domain from './models/Domain.js';

const app = express();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5174';

app.use(cors({ origin: ORIGIN }));
app.use(express.json());

// Mongo
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('Mongo connected');
}).catch(e => console.error('Mongo error', e));

// Health
app.get('/health', (_, res) => res.json({ ok: true }));

// Track endpoint
app.post('/track', async (req, res) => {
  try {
    const { url, seconds, dateISO } = req.body || {};
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const date = (dateISO ? new Date(dateISO) : new Date()).toISOString().slice(0,10);

    const doc = await Entry.findOneAndUpdate(
      { domain, date },
      { $inc: { seconds: Math.max(0, Number(seconds) || 0) } },
      { upsert: true, new: true }
    );
    res.json({ ok: true, doc });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'bad_request' });
  }
});

// Classification CRUD
app.get('/domains', async (_req, res) => {
  const list = await Domain.find().sort({ domain: 1 });
  res.json(list);
});
app.post('/domains', async (req, res) => {
  const { domain, type } = req.body || {};
  if (!domain) return res.status(400).json({ error: 'domain_required' });
  const safeType = ["productive","unproductive","neutral"].includes(type) ? type : "neutral";
  const doc = await Domain.findOneAndUpdate({ domain }, { type: safeType }, { upsert: true, new: true });
  res.json(doc);
});

// Summary (default 7 days)
app.get('/summary', async (req, res) => {
  const days = Math.max(1, Math.min(30, Number(req.query.days) || 7));
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));
  const fromStr = from.toISOString().slice(0,10);

  const entries = await Entry.aggregate([
    { $match: { date: { $gte: fromStr } } },
    { $group: { _id: "$domain", seconds: { $sum: "$seconds" } } },
    { $project: { domain: "$_id", seconds: 1, _id: 0 } },
    { $sort: { seconds: -1 } }
  ]);

  const domains = await Domain.find();
  const map = Object.fromEntries(domains.map(d => [d.domain, d.type]));

  const total = entries.reduce((s,e)=>s+e.seconds,0) || 1;
  const withClass = entries.map(e => ({
    ...e,
    type: map[e.domain] || 'neutral',
    percent: Math.round((e.seconds / total) * 1000) / 10
  }));

  const productive = withClass.filter(d => d.type === 'productive').reduce((s,e)=>s+e.seconds,0);
  const unproductive = withClass.filter(d => d.type === 'unproductive').reduce((s,e)=>s+e.seconds,0);

  res.json({
    rangeDays: days,
    totalSeconds: total,
    productiveSeconds: productive,
    unproductiveSeconds: unproductive,
    items: withClass
  });
});

// --- Serve dashboard build (optional) ---
// If you run `vite build` in dashboard and copy dist here, you can serve static files.
// Here we just mount /dashboard to the dev server URL for convenience:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get('/dashboard', (_req,res) => {
  res.redirect(ORIGIN); // open Vite dev server running the dashboard
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
