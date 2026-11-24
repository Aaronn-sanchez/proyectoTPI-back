const servicios = require('../services/checkpoint_service');
const zod = require('zod');
const { manejar, leerId, invalido } = require('./roles_controller');

// El estado de los objetos es un JSON libre, pero con tope de tamaño
const estadoSchema = zod.record(zod.string(), zod.unknown())
    .refine((e) => JSON.stringify(e).length <= 50000);

const posicion = {
    pos_x: zod.number(),
    pos_y: zod.number(),
    estado_objetos: estadoSchema,
};

const crearSchema = zod.object({
    id_nivel: zod.number().int().min(0),
    nombre: zod.string().trim().min(1).max(50),
    ...posicion,
});

const reescribirSchema = zod.object({
    nombre: zod.string().trim().min(1).max(50),
    ...posicion,
});

function leerNivel(req) {
    const nivel = Number(req.query.nivel);
    return Number.isInteger(nivel) && nivel >= 0 ? nivel : null;
}

const listar = manejar(async (req, res) => {
    const nivel = leerNivel(req);
    if (nivel === null) return invalido(res);
    res.json(await servicios.listar(req.user.id, nivel));
});

const ultimo = manejar(async (req, res) => {
    const nivel = leerNivel(req);
    if (nivel === null) return invalido(res);
    res.json(await servicios.ultimo(req.user.id, nivel));
});

const obtener = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return invalido(res);
    res.json(await servicios.obtener(req.user.id, id));
});

const crear = manejar(async (req, res) => {
    const datos = crearSchema.safeParse(req.body);
    if (!datos.success) return invalido(res);
    res.status(201).json(await servicios.crear(req.user.id, datos.data));
});

const reescribir = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    const datos = reescribirSchema.safeParse(req.body);
    if (!id || !datos.success) return invalido(res);
    res.json(await servicios.reescribir(req.user.id, id, datos.data));
});

const borrar = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return invalido(res);
    res.json(await servicios.borrar(req.user.id, id));
});

module.exports = { listar, ultimo, obtener, crear, reescribir, borrar };