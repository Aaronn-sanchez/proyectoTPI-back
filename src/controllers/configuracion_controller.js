const servicios = require('../services/configuracion_service');
const zod = require('zod');

// Al menos un campo, y cada uno dentro de su rango
const configuracionSchema = zod
    .object({
        volumen_musica: zod.number().int().min(0).max(100).optional(),
        idioma: zod.number().int().min(0).max(1).optional(),
    })
    .refine((datos) => Object.keys(datos).length > 0);

const perfilSchema = zod.object({
    nombre: zod.string().trim().min(1).max(30),
});

function responderError(res, error) {
    if (error.status) {
        return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
}

// Convierte el :id de la dirección en número (o null si no es válido)
function leerId(req) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id >= 1 ? id : null;
}

async function obtener(req, res) {
    try {
        res.json(await servicios.obtener(req.user.id));
    } catch (error) {
        responderError(res, error);
    }
}

async function actualizar(req, res) {
    const datos = configuracionSchema.safeParse(req.body);
    if (!datos.success) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    try {
        res.json(await servicios.actualizar(req.user.id, datos.data));
    } catch (error) {
        responderError(res, error);
    }
}

async function crearPerfil(req, res) {
    const datos = perfilSchema.safeParse(req.body);
    if (!datos.success) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    try {
        res.status(201).json(await servicios.crearPerfil(req.user.id, datos.data.nombre));
    } catch (error) {
        responderError(res, error);
    }
}

async function aplicarPerfil(req, res) {
    const id = leerId(req);
    if (!id) return res.status(400).json({ error: 'Datos inválidos' });
    try {
        res.json(await servicios.aplicarPerfil(req.user.id, id));
    } catch (error) {
        responderError(res, error);
    }
}

async function borrarPerfil(req, res) {
    const id = leerId(req);
    if (!id) return res.status(400).json({ error: 'Datos inválidos' });
    try {
        res.json(await servicios.borrarPerfil(req.user.id, id));
    } catch (error) {
        responderError(res, error);
    }
}

module.exports = { obtener, actualizar, crearPerfil, aplicarPerfil, borrarPerfil };