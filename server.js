// server.js — HomeFixerKhulna AI Server (Main Entry Point)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const bookingRoutes = require('./routes/booking');
const servicesRoutes = require('./routes/services');
const messengerRoutes = require('./routes/messenger');
const adminRoutes = require('./routes/admin');
const { getReply } = require('./chatbot');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dashboard')));

// --- Routes ---
app.use('/bookings', bookingRoutes);
app.use('/booking', bookingRoutes);
app.use('/services', servicesRoutes);
app.use('/webhook', messengerRoutes);
app.use('/admin', adminRoutes);

// --- Chatbot API ---
app.post('/chat', (req, res) => {
  const { message } = req.body;
  const reply = getReply(message);
  res.json({ success: true, reply });
});

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    business: 'HomeFixerKhulna',
    time: new Date().toLocaleString('bn-BD'),
    uptime: process.uptime().toFixed(0) + 's'
  });
});

// --- Dashboard ---
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

app.get('/', (req, res) => {
  res.json({
    message: '🏠 HomeFixerKhulna AI Server চালু আছে!',
    version: '1.0.0',
    endpoints: [
      'GET  /health',
      'GET  /services',
      'GET  /bookings',
      'POST /booking',
      'POST /chat',
      'GET  /webhook',
      'POST /webhook',
      'GET  /dashboard',
      'POST /admin/login',
      'GET  /admin/stats'
    ]
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n🏠 HomeFixerKhulna AI Server`);
  console.log(`✅ চালু হয়েছে: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🕐 সার্ভিস সময়: সকাল ৯টা – রাত ৯টা\n`);
});

module.exports = app;
