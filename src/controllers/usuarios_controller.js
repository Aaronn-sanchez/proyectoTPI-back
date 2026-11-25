const servicios = require('../services/usuarios_service');
const zod = require('zod');
const { manejar, leerId, invalido } = require('./roles_controller');

const rolSchema = zod.object({ id_rol: zod.number().int().min(1) });

const listar = manejar(async (req, res) =>
    res.json({ usuarios: await servicios.listar() }));

const listarRoles = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return invalido(res);
    res.json(await servicios.listarRoles(id));
});

const asignarRol = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    const datos = rolSchema.safeParse(req.body);
    if (!id || !datos.success) return invalido(res);
    res.status(201).json(await servicios.asignarRol(id, datos.data.id_rol));
});

const deshabilitar = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    if (!id) return invalido(res);
    res.json(await servicios.deshabilitar(id));
});

const quitarRol = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    const idRol = leerId(req.params.idRol);
    if (!id || !idRol) return invalido(res);
    res.json(await servicios.quitarRol(id, idRol));
});
const nombreSchema = zod.object({ nombre: zod.string().trim().min(1).max(50) });

const renombrar = manejar(async (req, res) => {
    const id = leerId(req.params.id);
    const datos = nombreSchema.safeParse(req.body);
    if (!id || !datos.success) return invalido(res);
    res.json(await servicios.renombrar(id, datos.data.nombre));
});

module.exports = { listar, listarRoles, asignarRol, quitarRol, deshabilitar, renombrar };
