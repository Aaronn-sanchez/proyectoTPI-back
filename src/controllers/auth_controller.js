const servicios = require('../services/auth_service');
const zod = require('zod');

const registerSchema = zod.object({
    nombre: zod.string().trim().min(1),
    email: zod.string().email(),
    pass: zod.string().min(8).max(72), // bcrypt ignora lo que pase de 72 bytes
});

const loginSchema = zod.object({
    email: zod.string().email(),
    pass: zod.string().min(1),
});

function responderError(res, error) {
    if (error.status) {
        return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
}

async function register(req, res) {
    const datos = registerSchema.safeParse(req.body);
    if (!datos.success) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
        const { nombre, email, pass } = datos.data;
        const response = await servicios.register(nombre, email, pass);
        res.status(201).json(response);
    } catch (error) {
        responderError(res, error);
    }
}

async function login(req, res) {
    const datos = loginSchema.safeParse(req.body);
    if (!datos.success) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
        const { email, pass } = datos.data;
        const response = await servicios.login(email, pass);
        res.json(response);
    } catch (error) {
        responderError(res, error);
    }
}

async function me(req, res) {
    res.json({ usuario: req.user });
}

module.exports = { register, login, me };