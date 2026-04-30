// routes/messenger.js — Facebook Messenger Webhook

const express = require('express');
const router = express.Router();
const axios = require('axios');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'homefixer_verify_2024';

// Bangla AI Reply Logic
const getBanglaReply = (message) => {
  const msg = message.toLowerCase().trim();

  if (msg.includes('হ্যালো') || msg.includes('হ্যালো') || msg.includes('hello') || msg.includes('hi') || msg.includes('সালাম')) {
    return 'আসসালামু আলাইকুম! 🏠 HomeFixerKhulna-তে স্বাগতম। আমরা খুলনায় AC, ফ্রিজ, ইলেকট্রিক, প্লাম্বিং ও সিসিটিভি সার্ভিস দিয়ে থাকি। কী সার্ভিস দরকার?';
  }
  if (msg.includes('এসি') || msg.includes('ac') || msg.includes('air condition')) {
    return '❄️ এসি সার্ভিসিং প্যাকেজ:\n• সাধারণ ক্লিনিং: ৫০০ টাকা\n• ফুল সার্ভিসিং: ৮০০ টাকা\n• রিপেয়ার: ইন্সপেকশনের পরে\n• ইন্সটলেশন: ১৫০০ টাকা\n\nবুকিং করতে আপনার নাম ও ফোন নম্বর দিন।';
  }
  if (msg.includes('ফ্রিজ') || msg.includes('fridge') || msg.includes('refrigerator')) {
    return '🧊 ফ্রিজ রিপেয়ার সার্ভিস উপলব্ধ।\nভিজিটিং চার্জ: ৩০০ টাকা\nচূড়ান্ত মূল্য ইন্সপেকশনের পর।\n\nবুকিং করতে চান? নাম ও ফোন নম্বর দিন।';
  }
  if (msg.includes('ইলেকট্রিক') || msg.includes('electric') || msg.includes('ওয়্যারিং') || msg.includes('ফ্যান')) {
    return '⚡ ইলেকট্রিক্যাল সার্ভিস:\n• ফ্যান, সুইচ, লাইট ঠিক করা\n• নতুন ওয়্যারিং\n• যেকোনো ইলেকট্রিক সমস্যা\n\nভিজিটিং চার্জ: ৩০০ টাকা। বুকিং করবেন?';
  }
  if (msg.includes('প্লাম্বিং') || msg.includes('plumbing') || msg.includes('পানি') || msg.includes('বেসিন') || msg.includes('ট্যাপ')) {
    return '🔧 প্লাম্বিং সার্ভিস:\n• ট্যাপ, বেসিন, পাইপলাইন\n• বাথরুম ফিটিংস\n• যেকোনো পানির সমস্যা\n\nভিজিটিং চার্জ: ৩০০ টাকা।';
  }
  if (msg.includes('সিসিটিভি') || msg.includes('cctv') || msg.includes('ক্যামেরা')) {
    return '📹 CCTV ইন্সটলেশন সার্ভিস:\n• হোম ও অফিস সিকিউরিটি\n• ইন্সটলেশন শুরু: ২০০০ টাকা\n• মেইনটেন্যান্স সার্ভিস ও আছে\n\nবিস্তারিত জানতে: 01915200299';
  }
  if (msg.includes('দাম') || msg.includes('price') || msg.includes('মূল্য') || msg.includes('কত')) {
    return '💰 আমাদের মূল্য তালিকা:\n• ভিজিটিং চার্জ: ৩০০ টাকা\n• এসি সার্ভিসিং: ৫০০ টাকা থেকে\n• ফ্রিজ রিপেয়ার: ৪০০ টাকা থেকে\n• ইলেকট্রিক: ৩০০ টাকা থেকে\n• প্লাম্বিং: ৩০০ টাকা থেকে\n\nবিস্তারিত জানতে কল করুন: 01915200299';
  }
  if (msg.includes('সময়') || msg.includes('time') || msg.includes('কখন') || msg.includes('hours')) {
    return '🕐 সার্ভিস সময়:\n• টেকনিশিয়ান সার্ভিস: সকাল ৯টা – রাত ৯টা\n• বুকিং: ২৪/৭\n\nএখনই বুক করুন!';
  }
  if (msg.includes('বুকিং') || msg.includes('booking') || msg.includes('বুক') || msg.includes('সার্ভিস নেব')) {
    return '📋 বুকিংয়ের জন্য নিচের তথ্য দিন:\n1️⃣ আপনার নাম\n2️⃣ ঠিকানা (খুলনা সিটি)\n3️⃣ ফোন নম্বর\n4️⃣ কী সার্ভিস দরকার\n5️⃣ পছন্দের সময়';
  }
  if (msg.includes('জরুরি') || msg.includes('emergency') || msg.includes('urgent')) {
    return '🚨 জরুরি সার্ভিসের জন্য এখনই কল করুন:\n📞 01915200299\n\nআমাদের টিম দ্রুত আপনার কাছে পৌঁছাবে।';
  }
  if (msg.includes('ওয়ারেন্টি') || msg.includes('warranty') || msg.includes('গ্যারান্টি')) {
    return '✅ আমাদের ওয়ারেন্টি পলিসি:\n• ৭ দিন / ১৫ দিন / ৩০ দিন\n(সার্ভিসের ধরন অনুযায়ী)\n\nওয়ারেন্টি পিরিয়ডে ফ্রি সাপোর্ট পাবেন।';
  }

  return '🏠 HomeFixerKhulna সব ধরনের হোম সার্ভিস দিয়ে থাকে।\n\nআরও তথ্যের জন্য:\n📞 01915200299\n⏰ সকাল ৯টা – রাত ৯টা\n\nবুকিং করতে "বুকিং" লিখুন।';
};

const sendMessage = async (recipientId, text) => {
  if (!PAGE_ACCESS_TOKEN) return;
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      { recipient: { id: recipientId }, message: { text } }
    );
  } catch (err) {
    console.error('Messenger send error:', err.message);
  }
};

// GET /webhook — Facebook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Facebook Webhook Verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// POST /webhook — receive messages
router.post('/', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry?.forEach(entry => {
      entry.messaging?.forEach(async event => {
        if (event.message?.text) {
          const senderId = event.sender.id;
          const reply = getBanglaReply(event.message.text);
          await sendMessage(senderId, reply);
        }
      });
    });
  }

  res.sendStatus(200);
});

module.exports = router;
