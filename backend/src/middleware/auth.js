const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'maxxstream_secret_fallback_change_me';

module.exports = function autenticar(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token ausente.' });

  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
