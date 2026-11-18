const servicios = require('../services/auth_service');
const zod = require('zod');

const registerSchema = zod.object({
    nombre: zod.string().trim().min(1).max(50),
    email: zod.email().max(100).toLowerCase(),
    pass: zod.string().min(8).max(72), // bcrypt ignora lo que pase de 72 bytes
});

const loginSchema = zod.object({
    email: zod.email().toLowerCase(),
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

const nombreSchema = zod.object({
    nombre: zod.string().trim().min(1).max(50),
});

async function actualizarNombre(req, res) {
    const datos = nombreSchema.safeParse(req.body);
    if (!datos.success) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
        const response = await servicios.actualizarNombre(req.user.id, datos.data.nombre);
        res.json(response);
    } catch (error) {
        responderError(res, error);
    }
}

async function me(req, res) {
    res.json({ usuario: req.user });
}

async function qaCheck(req, res) {
    res.json({ mensaje: 'Acceso QA concedido', usuario: req.user });
}

async function eliminarCuenta(req, res) {
    try {
        const response = await servicios.eliminarCuenta(req.user.id);
        res.json(response);
    } catch (error) {
        responderError(res, error);
    }
}

module.exports = { register, login, me, qaCheck, actualizarNombre, eliminarCuenta };
