// routes/admin.js — Admin Routes

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');

const DB_PATH = path.join(__dirname, '../db.json');
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// POST /admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USERNAME || 'admin';
  const validPass = process.env.ADMIN_PASSWORD || 'changeme123';

  if (username === validUser && password === validPass) {
    return res.json({ success: true, token: validPass, message: 'লগইন সফল হয়েছে।' });
  }
  res.status(401).json({ success: false, message: 'ভুল ইউজারনেম বা পাসওয়ার্ড।' });
});

// GET /admin/stats — dashboard stats (protected)
router.get('/stats', auth, (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    stats: {
      totalBookings: db.bookings.length,
      pendingBookings: db.bookings.filter(b => b.status === 'pending').length,
      completedBookings: db.bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: db.bookings.filter(b => b.status === 'cancelled').length,
      totalCustomers: db.customers.length,
      recentBookings: db.bookings.slice(-5).reverse()
    }
  });
});

module.exports = router;
