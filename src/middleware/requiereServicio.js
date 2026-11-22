const { obtenerServicios } = require('../services/permisos_service');

// Se usa DESPUÉS de auth. Pasa si el usuario tiene AL MENOS UNO de los servicios pedidos.
module.exports = function requiereServicio(...claves) {
    return async (req, res, next) => {
        try {
            const servicios = await obtenerServicios(req.user.id);
            if (!claves.some((c) => servicios.includes(c))) {
                return res.status(403).json({ error: 'No tenés permiso para esta acción' });
            }
            req.servicios = servicios;
            next();
        } catch (error) {
            next(error);
        }
    };
};