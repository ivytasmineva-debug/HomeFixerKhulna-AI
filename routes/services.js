// routes/services.js — Service List Routes

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// GET /services — all services with pricing
router.get('/', (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    visitingCharge: parseInt(process.env.VISITING_CHARGE) || 300,
    services: db.services,
    note: 'চূড়ান্ত মূল্য ইন্সপেকশনের পরে নির্ধারিত হবে।'
  });
});

// GET /services/:category
router.get('/:category', (req, res) => {
  const db = readDB();
  const filtered = db.services.filter(s => s.category === req.params.category);
  res.json({ success: true, services: filtered });
});

module.exports = router;
