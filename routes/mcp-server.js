// mcp-server.js — HomeFixerKhulna MCP Server
// Model Context Protocol Server for AI agents

const readline = require('readline');

// ============================================================
// Business Data (Business Context for AI)
// ============================================================
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

// ============================================================
// MCP JSON-RPC Protocol Handler (stdio transport)
// ============================================================
const rl = readline.createInterface({ input: process.stdin });
const pending = new Map();

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

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
});

process.stderr.write('🏠 HomeFixerKhulna MCP Server started\n');
