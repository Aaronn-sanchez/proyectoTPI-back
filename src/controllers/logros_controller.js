const servicios = require('../services/logros_service');
const zod = require('zod');

const progresoSchema = zod.object({
    codigo: zod.string().trim().min(1).max(40),
    incremento: zod.number().int().min(1).max(10).default(1),
});

function responderError(res, error) {
    if (error.status) {
        return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
}

async function listar(req, res) {
    try {
        // req.user.id lo puso el middleware auth, a partir del token
        const logros = await servicios.listar(req.user.id);
        res.json({ logros });
    } catch (error) {
        responderError(res, error);
    }
}

async function registrarProgreso(req, res) {
    const datos = progresoSchema.safeParse(req.body);
    if (!datos.success) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
        const { codigo, incremento } = datos.data;
        const resultado = await servicios.registrarProgreso(req.user.id, codigo, incremento);
        res.json(resultado);
    } catch (error) {
        responderError(res, error);
    }
}

module.exports = { listar, registrarProgreso };