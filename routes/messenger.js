const express = require('express');
const router = express.Router();
const axios = require('axios');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'homefixer_verify_2024';
const BUSINESS = {
  name: 'HomeFixerKhulna',
  phone: '+8801915200299',
  whatsapp: '8801711170639',
  email: 'homefixerkhulna@gmail.com',
  address: 'N/I-15 Khalispur, Khulna, GPO-9000',
  serviceArea: 'Khulna city only',
  serviceHours: { open: '09:00', close: '21:00', booking: '24/7' },
  visitingCharge: 300,
  paymentMethods: ['Cash', 'bKash', 'Nagad', 'Rocket'],
};

const SERVICES = [
  { id: 'ac-service', name: 'AC Servicing & Repair', nameBn: 'এসি সার্ভিসিং ও রিপেয়ার', price: 500, warranty: 30, category: 'ac' },
  { id: 'ac-install', name: 'AC Installation', nameBn: 'এসি ইন্সটলেশন', price: 1500, warranty: 30, category: 'ac' },
  { id: 'ac-clean', name: 'AC Cleaning', nameBn: 'এসি ক্লিনিং', price: 500, warranty: 7, category: 'ac' },
  { id: 'fridge', name: 'Refrigerator Repair', nameBn: 'ফ্রিজ রিপেয়ার', price: 400, warranty: 15, category: 'fridge' },
  { id: 'electric', name: 'Electrical Services', nameBn: 'ইলেকট্রিক্যাল সার্ভিস', price: 300, warranty: 7, category: 'electrical' },
  { id: 'plumbing', name: 'Plumbing Services', nameBn: 'প্লাম্বিং সার্ভিস', price: 300, warranty: 7, category: 'plumbing' },
  { id: 'cctv', name: 'CCTV Installation', nameBn: 'সিসিটিভি ইন্সটলেশন', price: 2000, warranty: 30, category: 'cctv' },
  { id: 'cleaning', name: 'Cleaning Solutions', nameBn: 'ক্লিনিং সলিউশন', price: 500, warranty: 0, category: 'cleaning' },
  { id: 'shifting', name: 'Shifting Services', nameBn: 'শিফটিং সার্ভিস', price: 1000, warranty: 0, category: 'shifting' },
  { id: 'electronics', name: 'Electronics Repair', nameBn: 'ইলেকট্রনিক্স রিপেয়ার', price: 300, warranty: 7, category: 'electronics' },
  { id: 'painting', name: 'Painting & Renovation', nameBn: 'পেইন্টিং ও রেনোভেশন', price: 5000, warranty: 0, category: 'painting' },
  { id: 'emergency', name: 'Emergency Service', nameBn: 'জরুরি সার্ভিস', price: 500, warranty: 7, category: 'emergency' },
];

const FAQS = [
  { q: 'What is the visiting charge?', a: 'Visiting charge is 300 BDT (approx). Final cost determined after inspection.' },
  { q: 'What are the service hours?', a: 'Technicians available 9 AM to 9 PM. Online booking available 24/7.' },
  { q: 'What warranty do you provide?', a: '7 days for electrical/plumbing, 15 days for refrigerator, 30 days for AC services.' },
  { q: 'What payment methods are accepted?', a: 'Cash, bKash, Nagad, and Rocket.' },
  { q: 'Do you serve outside Khulna?', a: 'Currently we only serve within Khulna city.' },
  { q: 'How to book a service?', a: 'Call 01915200299, WhatsApp, or use our chatbot 24/7.' },
];

// ============================================================
// MCP Tool Definitions
// ============================================================
const TOOLS = [
  {
    name: 'get_business_info',
    description: 'Get HomeFixerKhulna business information including contact, location, hours',
    inputSchema: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          description: 'Specific field: name, phone, address, hours, payment, all',
          enum: ['name', 'phone', 'address', 'hours', 'payment', 'all'],
        },
      },
      required: [],
    },
  },
  {
    name: 'list_services',
    description: 'List all available services with pricing and warranty info',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: ac, fridge, electrical, plumbing, cctv, cleaning, shifting, electronics, painting, emergency, all',
        },
        lang: {
          type: 'string',
          description: 'Language: en or bn',
          enum: ['en', 'bn'],
        },
      },
      required: [],
    },
  },
  {
    name: 'get_service_price',
    description: 'Get price and warranty for a specific service',
    inputSchema: {
      type: 'object',
      properties: {
        service_id: {
          type: 'string',
          description: 'Service ID (e.g., ac-service, fridge, plumbing)',
        },
        service_name: {
          type: 'string',
          description: 'Service name in English or Bangla',
        },
      },
      required: [],
    },
  },
  {
    name: 'check_availability',
    description: 'Check if service is available at a given time and location',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Customer location/area',
        },
        requested_time: {
          type: 'string',
          description: 'Requested time for service (e.g., "today 5pm", "tomorrow morning")',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'create_booking',
    description: 'Create a new service booking for a customer',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Customer full name' },
        phone: { type: 'string', description: 'Customer phone number' },
        address: { type: 'string', description: 'Customer address in Khulna' },
        service_type: { type: 'string', description: 'Type of service needed' },
        preferred_time: { type: 'string', description: 'Preferred time for service' },
        notes: { type: 'string', description: 'Additional notes or problem description' },
      },
      required: ['name', 'phone', 'address', 'service_type'],
    },
  },
  {
    name: 'get_faq',
    description: 'Get answers to frequently asked questions about HomeFixerKhulna',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The customer question or topic',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_technician_status',
    description: 'Check if technicians are currently available',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'suggest_service',
    description: 'Suggest the appropriate service based on customer problem description',
    inputSchema: {
      type: 'object',
      properties: {
        problem: {
          type: 'string',
          description: 'Customer problem description in English or Bangla',
        },
      },
      required: ['problem'],
    },
  },
];

// ============================================================
// Tool Handlers
// ============================================================
function handleTool(name, args) {
  switch (name) {
    case 'get_business_info': {
      const field = args.field || 'all';
      if (field === 'all') return { content: [{ type: 'text', text: JSON.stringify(BUSINESS, null, 2) }] };
      if (field === 'hours') return { content: [{ type: 'text', text: `Service Hours: ${BUSINESS.serviceHours.open} - ${BUSINESS.serviceHours.close}. Booking: ${BUSINESS.serviceHours.booking}` }] };
      return { content: [{ type: 'text', text: String(BUSINESS[field] || 'Information not found') }] };
    }

    case 'list_services': {
      const { category, lang = 'en' } = args;
      let list = category && category !== 'all' ? SERVICES.filter(s => s.category === category) : SERVICES;
      const formatted = list.map(s => ({
        id: s.id,
        name: lang === 'bn' ? s.nameBn : s.name,
        startingPrice: `${s.price} BDT`,
        warranty: s.warranty > 0 ? `${s.warranty} days` : 'No warranty',
        visitingCharge: `${BUSINESS.visitingCharge} BDT`,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] };
    }

    case 'get_service_price': {
      const { service_id, service_name } = args;
      let service = null;
      if (service_id) service = SERVICES.find(s => s.id === service_id);
      if (!service && service_name) {
        const q = service_name.toLowerCase();
        service = SERVICES.find(s => s.name.toLowerCase().includes(q) || s.nameBn.includes(service_name));
      }
      if (!service) return { content: [{ type: 'text', text: 'Service not found. Please specify a valid service.' }] };
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            service: service.name,
            serviceBn: service.nameBn,
            startingPrice: `${service.price} BDT`,
            visitingCharge: `${BUSINESS.visitingCharge} BDT`,
            warranty: service.warranty > 0 ? `${service.warranty} days` : 'No warranty',
            note: 'Final price determined after inspection',
          }, null, 2)
        }]
      };
    }

    case 'check_availability': {
      const { location, requested_time } = args;
      const isKhulna = location.toLowerCase().includes('khulna') ||
        ['খালিশপুর', 'সোনাডাঙ্গা', 'নিউমার্কেট', 'ডাকবাংলো', 'গল্লামারী'].some(a => location.includes(a));

      if (!isKhulna) {
        return {
          content: [{
            type: 'text',
            text: 'Service not available outside Khulna city. We only serve within Khulna city limits.'
          }]
        };
      }

      const now = new Date();
      const hour = now.getHours();
      const isOpen = hour >= 9 && hour < 21;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            available: true,
            location: location,
            requestedTime: requested_time || 'Not specified',
            technicianAvailable: isOpen,
            currentStatus: isOpen ? 'Open - Technicians available' : 'Closed - Book for next day 9 AM',
            serviceHours: '9:00 AM - 9:00 PM',
            bookingNote: 'Booking available 24/7 via chatbot',
          }, null, 2)
        }]
      };
    }

    case 'create_booking': {
      const { name, phone, address, service_type, preferred_time, notes } = args;
      if (!name || !phone || !address || !service_type) {
        return { content: [{ type: 'text', text: 'Missing required fields: name, phone, address, service_type' }], isError: true };
      }

      const booking = {
        id: `BK${Date.now()}`,
        name,
        phone,
        address,
        serviceType: service_type,
        preferredTime: preferred_time || 'Any time',
        notes: notes || '',
        status: 'pending',
        visitingCharge: BUSINESS.visitingCharge,
        createdAt: new Date().toISOString(),
        confirmationMessage: `ধন্যবাদ ${name}! আপনার বুকিং (${service_type}) গ্রহণ করা হয়েছে। শীঘ্রই আমাদের প্রতিনিধি ${phone} নম্বরে যোগাযোগ করবে।`,
      };

      // In real use: write to db.json via API call
      return { content: [{ type: 'text', text: JSON.stringify(booking, null, 2) }] };
    }

    case 'get_faq': {
      const { query } = args;
      const q = query.toLowerCase();
      const matched = FAQS.filter(f =>
        f.q.toLowerCase().split(' ').some(w => q.includes(w)) ||
        q.includes('price') || q.includes('charge') || q.includes('cost')
      );
      if (matched.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No specific FAQ found. Contact us: ${BUSINESS.phone} or visit ${BUSINESS.address}`
          }]
        };
      }
      return { content: [{ type: 'text', text: JSON.stringify(matched, null, 2) }] };
    }

    case 'get_technician_status': {
      const now = new Date();
      const hour = now.getHours();
      const isOpen = hour >= 9 && hour < 21;
      const nextOpen = isOpen ? null : '9:00 AM tomorrow';
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: isOpen ? 'available' : 'unavailable',
            message: isOpen
              ? 'টেকনিশিয়ান এখন উপলব্ধ। সার্ভিস বুক করুন!'
              : `এখন বন্ধ। আগামীকাল সকাল ৯টা থেকে সার্ভিস পাওয়া যাবে।`,
            serviceHours: '9:00 AM - 9:00 PM',
            nextAvailable: nextOpen,
            emergencyContact: BUSINESS.phone,
          }, null, 2)
        }]
      };
    }

    case 'suggest_service': {
      const { problem } = args;
      const p = problem.toLowerCase();
      let suggestions = [];

      if (p.includes('ac') || p.includes('এসি') || p.includes('air') || p.includes('cool') || p.includes('ঠান্ডা')) {
        suggestions.push(SERVICES.find(s => s.id === 'ac-service'));
      }
      if (p.includes('fridge') || p.includes('ফ্রিজ') || p.includes('refriger') || p.includes('freeze')) {
        suggestions.push(SERVICES.find(s => s.id === 'fridge'));
      }
      if (p.includes('electric') || p.includes('ইলেকট্রিক') || p.includes('light') || p.includes('লাইট') || p.includes('fan') || p.includes('ফ্যান') || p.includes('wiring')) {
        suggestions.push(SERVICES.find(s => s.id === 'electric'));
      }
      if (p.includes('water') || p.includes('পানি') || p.includes('pipe') || p.includes('tap') || p.includes('basin') || p.includes('leak')) {
        suggestions.push(SERVICES.find(s => s.id === 'plumbing'));
      }
      if (p.includes('camera') || p.includes('cctv') || p.includes('security') || p.includes('সিসিটিভি')) {
        suggestions.push(SERVICES.find(s => s.id === 'cctv'));
      }
      if (p.includes('clean') || p.includes('পরিষ্কার') || p.includes('dirty') || p.includes('dust')) {
        suggestions.push(SERVICES.find(s => s.id === 'cleaning'));
      }
      if (p.includes('shift') || p.includes('move') || p.includes('shifting') || p.includes('shifting')) {
        suggestions.push(SERVICES.find(s => s.id === 'shifting'));
      }
      if (p.includes('paint') || p.includes('রং') || p.includes('renovate') || p.includes('wall')) {
        suggestions.push(SERVICES.find(s => s.id === 'painting'));
      }
      if (p.includes('urgent') || p.includes('জরুরি') || p.includes('emergency') || p.includes('এখনই')) {
        suggestions.push(SERVICES.find(s => s.id === 'emergency'));
      }

      if (suggestions.length === 0) {
        suggestions = SERVICES.slice(0, 3);
      }

      const result = suggestions.filter(Boolean).map(s => ({
        id: s.id,
        name: s.name,
        nameBn: s.nameBn,
        startingPrice: `${s.price} BDT`,
        warranty: s.warranty > 0 ? `${s.warranty} days` : 'No warranty',
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            problem: problem,
            suggestedServices: result,
            visitingCharge: `${BUSINESS.visitingCharge} BDT`,
            note: 'Call to confirm: ' + BUSINESS.phone,
          }, null, 2)
        }]
      };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
}
// routes/messenger.js — HomeFixerKhulna Enhanced Facebook Messenger Auto Reply
// Features: Multi-turn booking flow, smart intent detection, Bangla/English bilingual

const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'homefixer_verify_2024';
const DB_PATH = path.join(__dirname, '../db.json');

// ============================================================
// In-memory session store (per sender)
// Format: { senderId: { step, data, lastActivity } }
// ============================================================
const sessions = new Map();

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function getSession(senderId) {
  const s = sessions.get(senderId);
  if (s && Date.now() - s.lastActivity > SESSION_TIMEOUT) {
    sessions.delete(senderId);
    return null;
  }
  return s;
}

function setSession(senderId, data) {
  sessions.set(senderId, { ...data, lastActivity: Date.now() });
}

function clearSession(senderId) {
  sessions.delete(senderId);
}

// ============================================================
// Save booking to db.json
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
  greeting: ['হ্যালো', 'hello', 'hi', 'সালাম', 'আস্সালামু', 'আসালামুয়ালাইকুম', 'শুরু', 'start', 'হাই'],
  booking: ['বুকিং', 'book', 'বুক', 'সার্ভিস নেব', 'সার্ভিস চাই', 'টেকনিশিয়ান', 'লোক পাঠান', 'order'],
  ac: ['এসি', 'ac', 'air condition', 'এয়ার কন্ডিশন', 'শীতাতপ'],
  fridge: ['ফ্রিজ', 'fridge', 'refrigerator', 'রেফ্রিজারেটর'],
  electric: ['ইলেকট্রিক', 'electric', 'ফ্যান', 'fan', 'লাইট', 'light', 'সুইচ', 'switch', 'ওয়্যারিং', 'wiring'],
  plumbing: ['প্লাম্বিং', 'plumbing', 'পানি', 'water', 'বেসিন', 'basin', 'ট্যাপ', 'tap', 'পাইপ', 'pipe', 'লিক'],
  cctv: ['cctv', 'সিসিটিভি', 'ক্যামেরা', 'camera', 'security', 'সিকিউরিটি'],
  cleaning: ['ক্লিনিং', 'cleaning', 'পরিষ্কার', 'clean', 'dirty'],
  shifting: ['শিফটিং', 'shifting', 'মুভিং', 'moving', 'বাসা বদল', 'অফিস বদল'],
  electronics: ['ইলেকট্রনিক্স', 'electronics', 'টিভি', 'tv', 'মোবাইল', 'computer', 'কম্পিউটার'],
  painting: ['পেইন্টিং', 'painting', 'রং', 'রঙ', 'renovation', 'রেনোভেশন'],
  emergency: ['জরুরি', 'emergency', 'urgent', 'এখনই', 'এখন', 'আজকেই'],
  price: ['দাম', 'price', 'মূল্য', 'কত', 'কত টাকা', 'charge', 'cost'],
  warranty: ['ওয়ারেন্টি', 'warranty', 'গ্যারান্টি', 'guarantee'],
  hours: ['সময়', 'time', 'hours', 'কখন', 'খোলা', 'বন্ধ'],
  payment: ['পেমেন্ট', 'payment', 'বিকাশ', 'bkash', 'নগদ', 'nagad', 'রকেট', 'rocket'],
  location: ['ঠিকানা', 'address', 'location', 'কোথায়', 'অফিস', 'office'],
  cancel: ['বাতিল', 'cancel', 'না', 'no', 'exit', 'বন্ধ করো', 'stop'],
  help: ['সাহায্য', 'help', 'কি কি', 'কী কী', 'সার্ভিস', 'services', 'menu', 'মেনু'],
};

function detectIntent(msg) {
  const m = msg.toLowerCase().trim();
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some(k => m.includes(k))) return intent;
  }
  return 'unknown';
}

function detectServiceFromText(msg) {
  const m = msg.toLowerCase();
  const serviceMap = {
    'এসি সার্ভিসিং ও রিপেয়ার': ['এসি', 'ac'],
    'ফ্রিজ রিপেয়ার': ['ফ্রিজ', 'fridge'],
    'ইলেকট্রিক্যাল সার্ভিস': ['ইলেকট্রিক', 'electric', 'ফ্যান', 'লাইট'],
    'প্লাম্বিং সার্ভিস': ['প্লাম্বিং', 'পানি', 'ট্যাপ', 'বেসিন'],
    'সিসিটিভি ইন্সটলেশন': ['cctv', 'সিসিটিভি', 'ক্যামেরা'],
    'ক্লিনিং সলিউশন': ['ক্লিনিং', 'পরিষ্কার'],
    'শিফটিং সার্ভিস': ['শিফটিং', 'মুভিং'],
    'ইলেকট্রনিক্স রিপেয়ার': ['ইলেকট্রনিক্স', 'টিভি'],
    'পেইন্টিং ও রেনোভেশন': ['পেইন্টিং', 'রং'],
    'জরুরি সার্ভিস': ['জরুরি', 'emergency'],
  };
  for (const [service, keys] of Object.entries(serviceMap)) {
    if (keys.some(k => m.includes(k))) return service;
  }
  return null;
}

// ============================================================
// Response Templates
// ============================================================
const R = {
  greeting: () =>
    `আসসালামু আলাইকুম! 🏠 *HomeFixerKhulna*-তে স্বাগতম!\n\n` +
    `আমরা খুলনায় আপনার দোরগোড়ায় সেবা দিয়ে থাকি:\n\n` +
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
    `কোন সার্ভিস দরকার? অথবা *বুকিং* লিখুন।`,

  price: () =>
    `💰 *মূল্য তালিকা*\n\n` +
    `• ভিজিটিং চার্জ: ৩০০ টাকা\n` +
    `• এসি ক্লিনিং: ৫০০ টাকা\n` +
    `• এসি ফুল সার্ভিস: ৮০০ টাকা\n` +
    `• এসি ইন্সটলেশন: ১৫০০ টাকা\n` +
    `• ফ্রিজ রিপেয়ার: ৪০০+ টাকা\n` +
    `• ইলেকট্রিক: ৩০০+ টাকা\n` +
    `• প্লাম্বিং: ৩০০+ টাকা\n` +
    `• সিসিটিভি: ২০০০+ টাকা\n` +
    `• শিফটিং: ১০০০+ টাকা\n\n` +
    `📌 চূড়ান্ত মূল্য ইন্সপেকশনের পর নির্ধারিত।`,

  warranty: () =>
    `✅ *ওয়ারেন্টি পলিসি*\n\n` +
    `• এসি সার্ভিস: ৩০ দিন\n` +
    `• ফ্রিজ রিপেয়ার: ১৫ দিন\n` +
    `• ইলেকট্রিক্যাল: ৭ দিন\n` +
    `• প্লাম্বিং: ৭ দিন\n` +
    `• সিসিটিভি: ৩০ দিন\n\n` +
    `ওয়ারেন্টি পিরিয়ডে বিনামূল্যে সাপোর্ট পাবেন ✨`,

  hours: () =>
    `🕐 *সার্ভিস সময়সূচী*\n\n` +
    `⏰ টেকনিশিয়ান: সকাল ৯টা – রাত ৯টা\n` +
    `📱 বুকিং: ২৪ ঘন্টা / ৭ দিন\n\n` +
    `জরুরি সার্ভিসের জন্য:\n📞 01915200299`,

  payment: () =>
    `💳 *পেমেন্ট পদ্ধতি*\n\n` +
    `• 💵 নগদ (Cash)\n` +
    `• 📱 বিকাশ (bKash)\n` +
    `• 📱 নগদ (Nagad)\n` +
    `• 📱 রকেট (Rocket)\n\n` +
    `সার্ভিস শেষে পেমেন্ট করতে পারবেন।`,

  location: () =>
    `📍 *আমাদের অফিস*\n\n` +
    `N/I-15 খালিশপুর, খুলনা\nGPO-9000\n\n` +
    `📞 01915200299\n` +
    `✉️ homefixerkhulna@gmail.com\n` +
    `🌐 fb.com/homefixerkhulna`,

  ac: () =>
    `❄️ *এসি সার্ভিস*\n\n` +
    `• সাধারণ ক্লিনিং: ৫০০ টাকা\n` +
    `• ফুল সার্ভিসিং: ৮০০ টাকা\n` +
    `• গ্যাস রিফিল: ইন্সপেকশনের পর\n` +
    `• ইন্সটলেশন: ১৫০০ টাকা\n` +
    `• ওয়ারেন্টি: ৩০ দিন\n\n` +
    `বুকিং করতে *বুকিং* লিখুন অথবা 📞 01915200299`,

  fridge: () =>
    `🧊 *ফ্রিজ রিপেয়ার*\n\n` +
    `• ভিজিটিং: ৩০০ টাকা\n` +
    `• রিপেয়ার: সমস্যা অনুযায়ী\n` +
    `• কম্প্রেসার, কুলিং সমস্যা সব সমাধান\n` +
    `• ওয়ারেন্টি: ১৫ দিন\n\n` +
    `বুকিং করতে *বুকিং* লিখুন`,

  electric: () =>
    `⚡ *ইলেকট্রিক্যাল সার্ভিস*\n\n` +
    `• ফ্যান, সুইচ, লাইট মেরামত\n` +
    `• নতুন ওয়্যারিং\n` +
    `• MCB, মিটার বক্স কাজ\n` +
    `• ভিজিটিং: ৩০০ টাকা\n` +
    `• ওয়ারেন্টি: ৭ দিন\n\n` +
    `বুকিং করতে *বুকিং* লিখুন`,

  plumbing: () =>
    `🔧 *প্লাম্বিং সার্ভিস*\n\n` +
    `• ট্যাপ, বেসিন, কমোড ঠিক করা\n` +
    `• পাইপলাইন মেরামত\n` +
    `• পানির ট্যাংক ফিটিংস\n` +
    `• ভিজিটিং: ৩০০ টাকা\n` +
    `• ওয়ারেন্টি: ৭ দিন\n\n` +
    `বুকিং করতে *বুকিং* লিখুন`,

  cctv: () =>
    `📹 *সিসিটিভি সার্ভিস*\n\n` +
    `• হোম ও অফিস ইন্সটলেশন\n` +
    `• শুরুর মূল্য: ২০০০ টাকা\n` +
    `• মেইনটেন্যান্স ও রিপেয়ার\n` +
    `• ওয়ারেন্টি: ৩০ দিন\n\n` +
    `বিস্তারিত: 📞 01915200299\nবুকিং করতে *বুকিং* লিখুন`,

  emergency: () =>
    `🚨 *জরুরি সার্ভিস*\n\n` +
    `এখনই কল করুন:\n📞 01915200299\n\n` +
    `আমাদের টিম যত দ্রুত সম্ভব পৌঁছাবে!\n` +
    `সার্ভিস সময়: সকাল ৯টা – রাত ৯টা`,

  bookingStart: () =>
    `📋 *সার্ভিস বুকিং*\n\n` +
    `চলুন বুকিং শুরু করি! 😊\n\n` +
    `প্রথমে আপনার *পুরো নাম* লিখুন:`,

  bookingPhone: (name) =>
    `ধন্যবাদ ${name}! 👍\n\nএখন আপনার *ফোন নম্বর* লিখুন:\n(যেমন: 01XXXXXXXXX)`,

  bookingAddress: () =>
    `✅ ফোন নম্বর সেভ হয়েছে!\n\nএখন আপনার *পূর্ণ ঠিকানা* লিখুন:\n(খুলনা সিটির মধ্যে হতে হবে)`,

  bookingService: () =>
    `✅ ঠিকানা সেভ হয়েছে!\n\nকোন *সার্ভিস* দরকার? নিচে থেকে বেছে লিখুন:\n\n` +
    `1️⃣ এসি সার্ভিসিং\n` +
    `2️⃣ ফ্রিজ রিপেয়ার\n` +
    `3️⃣ ইলেকট্রিক্যাল\n` +
    `4️⃣ প্লাম্বিং\n` +
    `5️⃣ সিসিটিভি\n` +
    `6️⃣ ক্লিনিং\n` +
    `7️⃣ শিফটিং\n` +
    `8️⃣ অন্যান্য`,

  bookingTime: () =>
    `✅ সার্ভিস নির্বাচন হয়েছে!\n\n*পছন্দের সময়* লিখুন:\n(যেমন: আজ বিকেল ৫টা, আগামীকাল সকাল ১০টা)`,

  bookingConfirm: (data) =>
    `✅ *বুকিং কনফার্মেশন*\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `👤 নাম: ${data.name}\n` +
    `📞 ফোন: ${data.phone}\n` +
    `📍 ঠিকানা: ${data.address}\n` +
    `🔧 সার্ভিস: ${data.serviceType}\n` +
    `🕐 সময়: ${data.preferredTime}\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `🎉 *বুকিং সফল হয়েছে!*\n` +
    `শীঘ্রই আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবে।\n\n` +
    `আরও সাহায্য দরকার হলে লিখুন।`,

  outsideKhulna: () =>
    `দুঃখিত 😔\n\nআমরা বর্তমানে *শুধুমাত্র খুলনা সিটিতে* সার্ভিস দিয়ে থাকি।\n\nআপনার ঠিকানা কি খুলনার মধ্যে? যদি হয় তাহলে সঠিক ঠিকানা দিন।`,

  unknown: () =>
    `🏠 আমি বুঝতে পারিনি। নিচের যেকোনো বিষয়ে জানতে পারি:\n\n` +
    `• *বুকিং* — সার্ভিস বুক করতে\n` +
    `• *দাম* — মূল্য তালিকা\n` +
    `• *সময়* — সার্ভিস সময়\n` +
    `• *ওয়ারেন্টি* — ওয়ারেন্টি তথ্য\n` +
    `• *পেমেন্ট* — পেমেন্ট পদ্ধতি\n\n` +
    `অথবা সরাসরি কল: 📞 01915200299`,
};

// ============================================================
// Booking Flow Handler
// ============================================================
function handleBookingFlow(senderId, msg, session) {
  const serviceNumbers = {
    '1': 'এসি সার্ভিসিং ও রিপেয়ার',
    '2': 'ফ্রিজ রিপেয়ার',
    '3': 'ইলেকট্রিক্যাল সার্ভিস',
    '4': 'প্লাম্বিং সার্ভিস',
    '5': 'সিসিটিভি ইন্সটলেশন',
    '6': 'ক্লিনিং সলিউশন',
    '7': 'শিফটিং সার্ভিস',
    '8': 'অন্যান্য সার্ভিস',
  };

  switch (session.step) {
    case 'name':
      if (msg.trim().length < 2) return 'অনুগ্রহ করে সঠিক নাম লিখুন:';
      setSession(senderId, { ...session, step: 'phone', data: { ...session.data, name: msg.trim() } });
      return R.bookingPhone(msg.trim());

    case 'phone':
      const phone = msg.replace(/[^0-9+]/g, '');
      if (phone.length < 10) return '❌ সঠিক ফোন নম্বর লিখুন (১০-১১ সংখ্যা):';
      setSession(senderId, { ...session, step: 'address', data: { ...session.data, phone } });
      return R.bookingAddress();

    case 'address':
      if (msg.trim().length < 5) return '❌ সঠিক ঠিকানা লিখুন:';
      const addr = msg.trim();
      const khulnaAreas = ['খুলনা', 'khulna', 'খালিশপুর', 'সোনাডাঙ্গা', 'নিউমার্কেট', 'ডাকবাংলো', 'গল্লামারী', 'বয়রা', 'রূপসা', 'দৌলতপুর'];
      const isKhulna = khulnaAreas.some(a => addr.toLowerCase().includes(a));
      // Accept if no explicit non-Khulna location
      setSession(senderId, { ...session, step: 'service', data: { ...session.data, address: addr } });
      return R.bookingService();

    case 'service':
      let serviceType = serviceNumbers[msg.trim()] || detectServiceFromText(msg) || msg.trim();
      setSession(senderId, { ...session, step: 'time', data: { ...session.data, serviceType } });
      return R.bookingTime();

    case 'time':
      const preferredTime = msg.trim() || 'যেকোনো সময়';
      const bookingData = { ...session.data, preferredTime };

      // Save to DB
      const booking = {
        id: Date.now().toString(),
        ...bookingData,
        status: 'pending',
        source: 'facebook_messenger',
        createdAt: new Date().toISOString(),
      };
      saveBooking(booking);
      clearSession(senderId);
      return R.bookingConfirm(bookingData);

    default:
      clearSession(senderId);
      return R.unknown();
  }
}

// ============================================================
// Main Message Handler
// ============================================================
function processMessage(senderId, msgText) {
  const msg = msgText.trim();
  const session = getSession(senderId);

  // Cancel booking flow
  if (session && detectIntent(msg) === 'cancel') {
    clearSession(senderId);
    return 'বুকিং বাতিল করা হয়েছে। আবার বুকিং করতে *বুকিং* লিখুন। 😊';
  }

  // Continue booking flow
  if (session && session.step) {
    return handleBookingFlow(senderId, msg, session);
  }

  // Start booking flow
  const intent = detectIntent(msg);
  if (intent === 'booking') {
    setSession(senderId, { step: 'name', data: {} });
    return R.bookingStart();
  }

  // Service intents — also offer booking
  switch (intent) {
    case 'greeting': return R.greeting();
    case 'price': return R.price();
    case 'warranty': return R.warranty();
    case 'hours': return R.hours();
    case 'payment': return R.payment();
    case 'location': return R.location();
    case 'ac': return R.ac();
    case 'fridge': return R.fridge();
    case 'electric': return R.electric();
    case 'plumbing': return R.plumbing();
    case 'cctv': return R.cctv();
    case 'emergency': return R.emergency();
    case 'help': return R.greeting();
    default: return R.unknown();
  }
}

// ============================================================
// Facebook Graph API Sender
// ============================================================
async function sendMessage(recipientId, text) {
  if (!PAGE_ACCESS_TOKEN) {
    console.log(`[DEMO] Reply to ${recipientId}: ${text.slice(0, 80)}...`);
    return;
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text },
        messaging_type: 'RESPONSE',
      }
    );
  } catch (err) {
    console.error('Messenger send error:', err.response?.data || err.message);
  }
}

// Typing indicator for better UX
async function sendTyping(recipientId, on = true) {
  if (!PAGE_ACCESS_TOKEN) return;
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        sender_action: on ? 'typing_on' : 'typing_off',
      }
    );
  } catch (_) {}
}

// ============================================================
// Routes
// ============================================================
>>>>>>> Stashed changes

// ============================================================
// MCP JSON-RPC Protocol Handler (stdio transport)
// ============================================================
const rl = readline.createInterface({ input: process.stdin });
const pending = new Map();

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

<<<<<<< Updated upstream
function handleRequest(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    send({
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'homefixer-khulna-mcp', version: '1.0.0' },
      },
    });
    return;
  }

  if (method === 'notifications/initialized') return;

  if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params;
    try {
      const result = handleTool(name, args);
      send({ jsonrpc: '2.0', id, result });
    } catch (err) {
      send({
        jsonrpc: '2.0', id,
        result: { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true },
      });
    }
    return;
  }

  // Unknown method
  send({
    jsonrpc: '2.0', id,
    error: { code: -32601, message: `Method not found: ${method}` },
  });
}

rl.on('line', (line) => {
  try {
    const req = JSON.parse(line.trim());
    handleRequest(req);
  } catch (e) {
    // ignore parse errors
  }
=======
// POST /webhook — receive messages
router.post('/', async (req, res) => {
  // MUST return 200 immediately
  res.sendStatus(200);

  const body = req.body;
  if (body.object !== 'page') return;

  for (const entry of (body.entry || [])) {
    for (const event of (entry.messaging || [])) {
      if (!event.message?.text) continue;
      if (event.message.is_echo) continue; // Skip bot's own messages

      const senderId = event.sender.id;
      const text = event.message.text;

      console.log(`📨 Message from ${senderId}: ${text}`);

      // Show typing
      await sendTyping(senderId, true);

      // Small delay for natural feel
      await new Promise(r => setTimeout(r, 600));

      const reply = processMessage(senderId, text);

      await sendTyping(senderId, false);
      await sendMessage(senderId, reply);
    }
  }
});
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook Verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

router.post('/', (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    body.entry?.forEach(entry => {
      entry.messaging?.forEach(async event => {
        if (event.message?.text && !event.message.is_echo) {
          const reply = getBanglaReply(event.message.text);
          await sendMessage(event.sender.id, reply);
        }
      });
    });
  }
  res.sendStatus(200);
});

module.exports = router;
// POST /webhook/test — for testing without Facebook


