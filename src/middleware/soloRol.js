// Se usa DESPUÉS de auth, porque necesita req.user
module.exports = function soloRol(...rolesPermitidos) {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ error: 'No tenés permiso para esta acción' });
        }
        next();
    };
};