// middleware/auth.js — Admin Auth Middleware

const auth = (req, res, next) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  const validToken = process.env.ADMIN_PASSWORD || 'changeme123';

  if (!token || token !== validToken) {
    return res.status(401).json({
      success: false,
      message: 'অননুমোদিত অ্যাক্সেস। Admin token প্রয়োজন।'
    });
  }
  next();
};

module.exports = auth;
