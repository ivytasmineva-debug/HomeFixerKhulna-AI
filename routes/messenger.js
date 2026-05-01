// routes/messenger.js — HomeFixerKhulna Facebook Messenger Auto Reply
// Production Ready | Bangla + English | Multi-turn Booking Flow

const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'homefixer_verify_2024';
const DB_PATH = path.join(__dirname, '../db.json');

// ============================================================
// Session Store (Multi-turn booking flow)
// ============================================================
const sessions = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function getSession(id) {
  const s = sessions.get(id);
  if (s && Date.now() - s.lastActivity > SESSION_TIMEOUT) {
    sessions.delete(id);
    return null;
  }
  return s || null;
}

function setSession(id, data) {
  sessions.set(id, { ...data, lastActivity: Date.now() });
}

function clearSession(id) {
  sessions.delete(id);
}

// ============================================================
// Save Booking to db.json
// ============================================================
function saveBooking(booking) {
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    db.bookings.push(booking);
    db.stats.totalBookings = db.bookings.length;
    db.stats.pendingBookings = db.bookings.filter(b => b.status === 'pending').length;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return true;
  } catch (e) {
    console.error('DB write error:', e.message);
    return false;
  }
}

// ============================================================
// Intent Detection
// ============================================================
const INTENTS = {
  greeting:   ['হ্যালো', 'hello', 'hi', 'সালাম', 'আস্সালামু', 'শুরু', 'start', 'হাই'],
  booking:    ['বুকিং', 'book', 'বুক', 'সার্ভিস নেব', 'সার্ভিস চাই', 'টেকনিশিয়ান', 'লোক পাঠান', 'order'],
  cancel:     ['বাতিল', 'cancel', 'exit', 'বন্ধ করো', 'stop'],
  ac:         ['এসি', 'ac', 'air condition', 'এয়ার কন্ডিশন'],
  fridge:     ['ফ্রিজ', 'fridge', 'refrigerator'],
  electric:   ['ইলেকট্রিক', 'electric', 'ফ্যান', 'fan', 'লাইট', 'light', 'সুইচ', 'ওয়্যারিং'],
  plumbing:   ['প্লাম্বিং', 'plumbing', 'পানি', 'water', 'বেসিন', 'ট্যাপ', 'tap', 'পাইপ', 'লিক'],
  cctv:       ['cctv', 'সিসিটিভি', 'ক্যামেরা', 'camera', 'security'],
  cleaning:   ['ক্লিনিং', 'cleaning', 'পরিষ্কার', 'clean'],
  shifting:   ['শিফটিং', 'shifting', 'মুভিং', 'moving', 'বাসা বদল'],
  electronics:['ইলেকট্রনিক্স', 'electronics', 'টিভি', 'tv', 'কম্পিউটার'],
  painting:   ['পেইন্টিং', 'painting', 'রং', 'renovation'],
  emergency:  ['জরুরি', 'emergency', 'urgent', 'এখনই'],
  price:      ['দাম', 'price', 'মূল্য', 'কত', 'charge', 'cost'],
  warranty:   ['ওয়ারেন্টি', 'warranty', 'গ্যারান্টি'],
  hours:      ['সময়', 'time', 'hours', 'কখন', 'খোলা'],
  payment:    ['পেমেন্ট', 'payment', 'বিকাশ', 'bkash', 'নগদ', 'nagad', 'রকেট'],
  location:   ['ঠিকানা', 'address', 'location', 'কোথায়', 'অফিস'],
  help:       ['সাহায্য', 'help', 'কি কি', 'সার্ভিস', 'services', 'menu', 'মেনু'],
};

function detectIntent(msg) {
  const m = msg.toLowerCase().trim();
  for (const [intent, keys] of Object.entries(INTENTS)) {
    if (keys.some(k => m.includes(k))) return intent;
  }
  return 'unknown';
}

function detectService(msg) {
  const m = msg.toLowerCase();
  const map = {
    'এসি সার্ভিসিং ও রিপেয়ার':  ['এসি', 'ac'],
    'ফ্রিজ রিপেয়ার':              ['ফ্রিজ', 'fridge'],
    'ইলেকট্রিক্যাল সার্ভিস':      ['ইলেকট্রিক', 'electric', 'ফ্যান', 'লাইট'],
    'প্লাম্বিং সার্ভিস':           ['প্লাম্বিং', 'পানি', 'ট্যাপ', 'বেসিন'],
    'সিসিটিভি ইন্সটলেশন':         ['cctv', 'সিসিটিভি', 'ক্যামেরা'],
    'ক্লিনিং সলিউশন':             ['ক্লিনিং', 'পরিষ্কার'],
    'শিফটিং সার্ভিস':             ['শিফটিং', 'মুভিং'],
    'ইলেকট্রনিক্স রিপেয়ার':      ['ইলেকট্রনিক্স', 'টিভি'],
    'পেইন্টিং ও রেনোভেশন':        ['পেইন্টিং', 'রং'],
    'জরুরি সার্ভিস':               ['জরুরি', 'emergency'],
  };
  const numMap = {
    '1': 'এসি সার্ভিসিং ও রিপেয়ার',
    '2': 'ফ্রিজ রিপেয়ার',
    '3': 'ইলেকট্রিক্যাল সার্ভিস',
    '4': 'প্লাম্বিং সার্ভিস',
    '5': 'সিসিটিভি ইন্সটলেশন',
    '6': 'ক্লিনিং সলিউশন',
    '7': 'শিফটিং সার্ভিস',
    '8': 'ইলেকট্রনিক্স রিপেয়ার',
    '9': 'পেইন্টিং ও রেনোভেশন',
    '10': 'জরুরি সার্ভিস',
  };
  if (numMap[msg.trim()]) return numMap[msg.trim()];
  for (const [service, keys] of Object.entries(map)) {
    if (keys.some(k => m.includes(k))) return service;
  }
  return msg.trim();
}

// ============================================================
// Reply Templates
// ============================================================
const R = {
  greeting: () =>
    `আসসালামু আলাইকুম! 🏠 HomeFixerKhulna-তে স্বাগতম!\n\n` +
    `আমরা খুলনায় আপনার দোরগোড়ায় সেবা দিই:\n\n` +
    `❄️ এসি সার্ভিসিং ও রিপেয়ার\n` +
    `🧊 ফ্রিজ রিপেয়ার\n` +
    `⚡ ইলেকট্রিক্যাল সার্ভিস\n` +
    `🔧 প্লাম্বিং সার্ভিস\n` +
    `📹 সিসিটিভি ইন্সটলেশন\n` +
    `🧹 ক্লিনিং সলিউশন\n` +
    `📦 শিফটিং সার্ভিস\n` +
    `🔌 ইলেকট্রনিক্স রিপেয়ার\n` +
    `🎨 পেইন্টিং ও রেনোভেশন\n` +
    `🚨 জরুরি সার্ভিস\n\n` +
    `সার্ভিস বুক করতে লিখুন: বুকিং\nঅথবা কল করুন: 📞 01915200299`,

  ac: () =>
    `❄️ এসি সার্ভিস:\n• ক্লিনিং: ৫০০ টাকা\n• ফুল সার্ভিস: ৮০০ টাকা\n• ইন্সটলেশন: ১৫০০ টাকা\n• ওয়ারেন্টি: ৩০ দিন\n\nবুকিং করতে লিখুন: বুকিং`,
  fridge: () =>
    `🧊 ফ্রিজ রিপেয়ার:\n• ভিজিটিং: ৩০০ টাকা\n• রিপেয়ার: সমস্যা অনুযায়ী\n• ওয়ারেন্টি: ১৫ দিন\n\nবুকিং করতে লিখুন: বুকিং`,
  electric: () =>
    `⚡ ইলেকট্রিক্যাল সার্ভিস:\n• ফ্যান, সুইচ, লাইট, ওয়্যারিং\n• ভিজিটিং: ৩০০ টাকা\n• ওয়ারেন্টি: ৭ দিন\n\nবুকিং করতে লিখুন: বুকিং`,
  plumbing: () =>
    `🔧 প্লাম্বিং সার্ভিস:\n• ট্যাপ, বেসিন, পাইপলাইন\n• ভিজিটিং: ৩০০ টাকা\n• ওয়ারেন্টি: ৭ দিন\n\nবুকিং করতে লিখুন: বুকিং`,
  cctv: () =>
    `📹 সিসিটিভি ইন্সটলেশন:\n• হোম ও অফিস সিকিউরিটি\n• শুরু: ২০০০ টাকা\n• ওয়ারেন্টি: ৩০ দিন\n\nবিস্তারিত: 📞 01915200299`,
  cleaning: () =>
    `🧹 ক্লিনিং সলিউশন:\n• হোম ও অফিস ক্লিনিং\n• শুরু: ৫০০ টাকা\n\nবুকিং করতে লিখুন: বুকিং`,
  shifting: () =>
    `📦 শিফটিং সার্ভিস:\n• বাসা ও অফিস শিফটিং\n• শুরু: ১০০০ টাকা\n\nবুকিং করতে লিখুন: বুকিং`,
  electronics: () =>
    `🔌 ইলেকট্রনিক্স রিপেয়ার:\n• টিভি, কম্পিউটার, গ্যাজেট\n• ভিজিটিং: ৩০০ টাকা\n• ওয়ারেন্টি: ৭ দিন\n\nবুকিং করতে লিখুন: বুকিং`,
  painting: () =>
    `🎨 পেইন্টিং ও রেনোভেশন:\n• শুরু: ৫০০০ টাকা\n• বিস্তারিত জানতে: 📞 01915200299`,
  emergency: () =>
    `🚨 জরুরি সার্ভিস!\nএখনই কল করুন: 📞 01915200299\nসময়: সকাল ৯টা – রাত ৯টা`,
  price: () =>
    `💰 মূল্য তালিকা:\n• ভিজিটিং চার্জ: ৩০০ টাকা\n• এসি ক্লিনিং: ৫০০ টাকা\n• ফ্রিজ রিপেয়ার: ৪০০+ টাকা\n• ইলেকট্রিক: ৩০০+ টাকা\n• প্লাম্বিং: ৩০০+ টাকা\n• সিসিটিভি: ২০০০+ টাকা\n\n📌 চূড়ান্ত মূল্য ইন্সপেকশনের পর।`,
  warranty: () =>
    `✅ ওয়ারেন্টি:\n• এসি: ৩০ দিন\n• ফ্রিজ: ১৫ দিন\n• ইলেকট্রিক/প্লাম্বিং: ৭ দিন\n• সিসিটিভি: ৩০ দিন\n\nওয়ারেন্টিতে ফ্রি সাপোর্ট।`,
  hours: () =>
    `🕐 সার্ভিস সময়:\n• টেকনিশিয়ান: সকাল ৯টা – রাত ৯টা\n• বুকিং: ২৪/৭\n\nজরুরি: 📞 01915200299`,
  payment: () =>
    `💳 পেমেন্ট পদ্ধতি:\n• নগদ (Cash)\n• বিকাশ (bKash)\n• নগদ (Nagad)\n• রকেট (Rocket)\n\nসার্ভিস শেষে পেমেন্ট।`,
  location: () =>
    `📍 অফিস: N/I-15 খালিশপুর, খুলনা, GPO-9000\n📞 01915200299\n✉️ homefixerkhulna@gmail.com`,

  bookingStart: () =>
    `📋 সার্ভিস বুকিং শুরু করি!\n\nপ্রথমে আপনার পুরো নাম লিখুন:\n\n(বাতিল করতে লিখুন: বাতিল)`,
  bookingPhone: (name) =>
    `ধন্যবাদ ${name}! 👍\n\nআপনার ফোন নম্বর লিখুন:\n(যেমন: 01XXXXXXXXX)`,
  bookingAddress: () =>
    `✅ ফোন সেভ হয়েছে!\n\nআপনার পূর্ণ ঠিকানা লিখুন:\n(খুলনা সিটির মধ্যে হতে হবে)`,
  bookingService: () =>
    `✅ ঠিকানা সেভ হয়েছে!\n\nকোন সার্ভিস দরকার?\n\n` +
    `1️⃣ এসি সার্ভিসিং\n2️⃣ ফ্রিজ রিপেয়ার\n3️⃣ ইলেকট্রিক্যাল\n4️⃣ প্লাম্বিং\n` +
    `5️⃣ সিসিটিভি\n6️⃣ ক্লিনিং\n7️⃣ শিফটিং\n8️⃣ ইলেকট্রনিক্স\n9️⃣ পেইন্টিং\n🔟 জরুরি`,
  bookingTime: () =>
    `✅ সার্ভিস নির্বাচন হয়েছে!\n\nপছন্দের সময় লিখুন:\n(যেমন: আজ বিকেল ৫টা, আগামীকাল সকাল ১০টা)`,
  bookingDone: (d) =>
    `✅ বুকিং কনফার্ম!\n\n` +
    `👤 নাম: ${d.name}\n📞 ফোন: ${d.phone}\n📍 ঠিকানা: ${d.address}\n` +
    `🔧 সার্ভিস: ${d.serviceType}\n🕐 সময়: ${d.preferredTime}\n\n` +
    `🎉 ধন্যবাদ! শীঘ্রই আমাদের প্রতিনিধি যোগাযোগ করবে।\nআরও সাহায্য লাগলে লিখুন।`,
  cancelMsg: () =>
    `বুকিং বাতিল করা হয়েছে। আবার বুক করতে লিখুন: বুকিং 😊`,
  unknown: () =>
    `🏠 বুঝতে পারিনি। নিচের যেকোনো বিষয়ে জিজ্ঞেস করুন:\n\n` +
    `• বুকিং — সার্ভিস বুক করতে\n• দাম — মূল্য তালিকা\n• সময় — সার্ভিস সময়\n` +
    `• ওয়ারেন্টি — ওয়ারেন্টি তথ্য\n• পেমেন্ট — পেমেন্ট পদ্ধতি\n\n` +
    `কল করুন: 📞 01915200299`,
};

// ============================================================
// Booking Flow
// ============================================================
function handleBookingFlow(senderId, msg, session) {
  switch (session.step) {
    case 'name':
      if (msg.trim().length < 2) return 'অনুগ্রহ করে সঠিক নাম লিখুন:';
      setSession(senderId, { ...session, step: 'phone', data: { ...session.data, name: msg.trim() } });
      return R.bookingPhone(msg.trim());

    case 'phone': {
      const phone = msg.replace(/[^0-9+]/g, '');
      if (phone.length < 10) return '❌ সঠিক ফোন নম্বর লিখুন (১০-১১ সংখ্যা):';
      setSession(senderId, { ...session, step: 'address', data: { ...session.data, phone } });
      return R.bookingAddress();
    }

    case 'address':
      if (msg.trim().length < 5) return '❌ সঠিক ঠিকানা লিখুন:';
      setSession(senderId, { ...session, step: 'service', data: { ...session.data, address: msg.trim() } });
      return R.bookingService();

    case 'service': {
      const serviceType = detectService(msg);
      setSession(senderId, { ...session, step: 'time', data: { ...session.data, serviceType } });
      return R.bookingTime();
    }

    case 'time': {
      const data = { ...session.data, preferredTime: msg.trim() || 'যেকোনো সময়' };
      const booking = {
        id: Date.now().toString(),
        ...data,
        status: 'pending',
        source: 'facebook_messenger',
        createdAt: new Date().toISOString(),
      };
      saveBooking(booking);
      clearSession(senderId);
      return R.bookingDone(data);
    }

    default:
      clearSession(senderId);
      return R.unknown();
  }
}

// ============================================================
// Main Message Processor
// ============================================================
function processMessage(senderId, text) {
  const msg = text.trim();
  const session = getSession(senderId);
  const intent = detectIntent(msg);

  // Cancel active booking flow
  if (session && intent === 'cancel') {
    clearSession(senderId);
    return R.cancelMsg();
  }

  // Continue booking flow
  if (session && session.step) {
    return handleBookingFlow(senderId, msg, session);
  }

  // Start booking flow
  if (intent === 'booking') {
    setSession(senderId, { step: 'name', data: {} });
    return R.bookingStart();
  }

  // Static intents
  const intentMap = {
    greeting: R.greeting, ac: R.ac, fridge: R.fridge,
    electric: R.electric, plumbing: R.plumbing, cctv: R.cctv,
    cleaning: R.cleaning, shifting: R.shifting, electronics: R.electronics,
    painting: R.painting, emergency: R.emergency, price: R.price,
    warranty: R.warranty, hours: R.hours, payment: R.payment,
    location: R.location, help: R.greeting,
  };

  return (intentMap[intent] || R.unknown)();
}

// ============================================================
// Facebook API Helpers
// ============================================================
async function sendMessage(recipientId, text) {
  if (!PAGE_ACCESS_TOKEN) {
    console.log(`[NO TOKEN] Reply: ${text.slice(0, 60)}...`);
    return;
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      { recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' }
    );
  } catch (err) {
    console.error('Send error:', err.response?.data?.error?.message || err.message);
  }
}

async function sendTyping(recipientId, on = true) {
  if (!PAGE_ACCESS_TOKEN) return;
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      { recipient: { id: recipientId }, sender_action: on ? 'typing_on' : 'typing_off' }
    );
  } catch (_) {}
}

// ============================================================
// Routes
// ============================================================

// GET /webhook — Facebook verification
router.get('/', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }
  console.warn('❌ Webhook verify failed. Token mismatch.');
  res.sendStatus(403);
});

// POST /webhook — receive messages
router.post('/', async (req, res) => {
  res.sendStatus(200); // Must respond immediately

  const body = req.body;
  if (body.object !== 'page') return;

  for (const entry of (body.entry || [])) {
    for (const event of (entry.messaging || [])) {
      if (!event.message?.text || event.message.is_echo) continue;

      const senderId = event.sender.id;
      const text = event.message.text;
      console.log(`📨 [${senderId}]: ${text}`);

      await sendTyping(senderId, true);
      await new Promise(r => setTimeout(r, 500));
      const reply = processMessage(senderId, text);
      await sendTyping(senderId, false);
      await sendMessage(senderId, reply);
    }
  }
});

// POST /webhook/test — local testing without Facebook
router.post('/test', (req, res) => {
  const { senderId = 'test-user', message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const reply = processMessage(senderId, message);
  res.json({ senderId, message, reply });
});

module.exports = router;
