// routes/booking.js — Booking Management Routes

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// GET /bookings — all bookings
router.get('/', (req, res) => {
  const db = readDB();
  res.json({ success: true, bookings: db.bookings });
});

// POST /booking — create new booking
router.post('/', (req, res) => {
  const { name, phone, address, serviceType, preferredTime } = req.body;

  if (!name || !phone || !address || !serviceType) {
    return res.status(400).json({
      success: false,
      message: 'নাম, ফোন, ঠিকানা এবং সার্ভিস টাইপ আবশ্যক।'
    });
  }

  const db = readDB();
  const booking = {
    id: Date.now().toString(),
    name,
    phone,
    address,
    serviceType,
    preferredTime: preferredTime || 'যেকোনো সময়',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.bookings.push(booking);
  db.stats.totalBookings = db.bookings.length;
  db.stats.pendingBookings = db.bookings.filter(b => b.status === 'pending').length;
  writeDB(db);

  res.status(201).json({
    success: true,
    message: 'ধন্যবাদ! আপনার সার্ভিস রিকোয়েস্ট গ্রহণ করা হয়েছে।',
    booking
  });
});

// PUT /booking/:id — update booking status
router.put('/:id', (req, res) => {
  const db = readDB();
  const idx = db.bookings.findIndex(b => b.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'বুকিং পাওয়া যায়নি।' });
  }

  db.bookings[idx] = { ...db.bookings[idx], ...req.body, updatedAt: new Date().toISOString() };
  db.stats.pendingBookings = db.bookings.filter(b => b.status === 'pending').length;
  db.stats.completedBookings = db.bookings.filter(b => b.status === 'completed').length;
  writeDB(db);

  res.json({ success: true, message: 'বুকিং আপডেট হয়েছে।', booking: db.bookings[idx] });
});

// DELETE /booking/:id — delete booking
router.delete('/:id', (req, res) => {
  const db = readDB();
  const idx = db.bookings.findIndex(b => b.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'বুকিং পাওয়া যায়নি।' });
  }

  db.bookings.splice(idx, 1);
  db.stats.totalBookings = db.bookings.length;
  writeDB(db);

  res.json({ success: true, message: 'বুকিং ডিলিট হয়েছে।' });
});

module.exports = router;
