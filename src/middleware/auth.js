const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
    const [tipo, token] = (req.headers.authorization || '').split(' ');

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    try {
        req.user = jwt.verify(token, process.env.TOKEN_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};