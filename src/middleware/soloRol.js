// Se usa DESPUÉS de auth, porque necesita req.user
module.exports = function soloRol(...rolesPermitidos) {
    return (req, res, next) => {
        const tiene = rolesPermitidos.some((r) => req.user.roles?.includes(r));
        if (!tiene) {
            return res.status(403).json({ error: 'No tenés permiso para esta acción' });
        }
        next();
    };
};