const servicios = require('../services/roles_service');
const zod = require('zod');

const ids = zod.array(zod.number().int().min(1)).max(50);

const crearSchema = zod.object({
    nombre_rol: zod.string().trim().min(1).max(50),
    servicios: ids.default([]),
    usuarios: ids.default([]),
});
const nombreSchema = zod.object({ nombre_rol: zod.string().trim().min(1).max(50) });
const listaServiciosSchema = zod.object({ servicios: ids });
const servicioSchema = zod.object({ id_servicio: zod.number().int().min(1) });

function responderError(res, error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
}

function leerId(valor) {
    const id = Number(valor);
    return Number.isInteger(id) && id >= 1 ? id : null;
}

// Envoltorio para no repetir try/catch en cada handler
function manejar(handler) {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (error) {
            responderError(res, error);
        }
    };
}

const invalido = (res) => res.status(400).json({ error: 'Datos inválidos' });

const listarServicios = manejar(async (req, res) =>
    res.json({ servicios: await servicios.listarServicios() }));

const listar = manejar(async (req, res) =>
    res.json({ roles: await servicios.listar() }));

const obtener = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return invalido(res);
    res.json(await servicios.obtener(id));
});

const crear = manejar(async (req, res) => {
    const datos = crearSchema.safeParse(req.body);
    if (!datos.success) return invalido(res);
    const { nombre_rol, servicios: s, usuarios } = datos.data;
    res.status(201).json(await servicios.crear(nombre_rol, s, usuarios));
});

const renombrar = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    const datos = nombreSchema.safeParse(req.body);
    if (!id || !datos.success) return invalido(res);
    res.json(await servicios.renombrar(id, datos.data.nombre_rol));
});

const borrar = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return invalido(res);
    res.json(await servicios.borrar(id));
});

const reemplazarServicios = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    const datos = listaServiciosSchema.safeParse(req.body);
    if (!id || !datos.success) return invalido(res);
    res.json(await servicios.reemplazarServicios(id, datos.data.servicios));
});

const agregarServicio = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    const datos = servicioSchema.safeParse(req.body);
    if (!id || !datos.success) return invalido(res);
    res.status(201).json(await servicios.agregarServicio(id, datos.data.id_servicio));
});

const quitarServicio = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    const idServicio = leerId(req.params.idServicio);
    if (!id || !idServicio) return invalido(res);
    res.json(await servicios.quitarServicio(id, idServicio));
});

module.exports = {
    manejar, leerId, invalido,
    listarServicios, listar, obtener, crear, renombrar, borrar,
    reemplazarServicios, agregarServicio, quitarServicio,
};