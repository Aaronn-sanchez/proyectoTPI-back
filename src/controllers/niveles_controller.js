const servicios = require('../services/niveles_service');
const zod = require('zod');

const nivelSchema = zod.object({
    id_nivel: zod.number().int().min(1),
});

function responderError(res, error) {
    if (error.status) {
        return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
}

async function obtener(req, res) {
    try {
        const progreso = await servicios.obtenerProgreso(req.user.id);
        res.json(progreso);
    } catch (error) {
        responderError(res, error);
    }
}

async function iniciar(req, res) {
    const datos = nivelSchema.safeParse(req.body);
    if (!datos.success) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
        const progreso = await servicios.iniciar(req.user.id, datos.data.id_nivel);
        res.json(progreso);
    } catch (error) {
        responderError(res, error);
    }
}

async function completar(req, res) {
    const datos = nivelSchema.safeParse(req.body);
    if (!datos.success) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
        const progreso = await servicios.completar(req.user.id, datos.data.id_nivel);
        res.json(progreso);
    } catch (error) {
        responderError(res, error);
    }
}

module.exports = { obtener, iniciar, completar };