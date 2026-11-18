const db = require('../config/database');

const POR_DEFECTO = { volumen_musica: 100, idioma: 0 };
const MAX_PERFILES = 3;

function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

async function obtenerActual(idUsuario) {
    const [rows] = await db.execute(
        'SELECT volumen_musica, idioma FROM CONFIGURACION_USUARIO WHERE id_usuario = ?',
        [idUsuario]
    );
    return rows[0] || POR_DEFECTO;
}

async function listarPerfiles(idUsuario) {
    const [rows] = await db.execute(
        `SELECT id_perfil, slot, nombre, volumen_musica, idioma
         FROM CONFIGURACION_PERFILES WHERE id_usuario = ? ORDER BY slot`,
        [idUsuario]
    );
    return rows;
}

// LA VISTA: configuración actual + perfiles guardados
async function obtener(idUsuario) {
    const configuracion = await obtenerActual(idUsuario);
    const perfiles = await listarPerfiles(idUsuario);
    return { configuracion, perfiles, maxPerfiles: MAX_PERFILES };
}

// Cambia solo los campos enviados (slider de música e idioma)
async function actualizar(idUsuario, { volumen_musica, idioma }) {
    // mysql2 no acepta undefined, por eso todo se pasa con ?? null
    await db.execute(
        `INSERT INTO CONFIGURACION_USUARIO (id_usuario, volumen_musica, idioma)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
            volumen_musica = COALESCE(?, volumen_musica),
            idioma         = COALESCE(?, idioma)`,
        [
            idUsuario,
            volumen_musica ?? POR_DEFECTO.volumen_musica,
            idioma ?? POR_DEFECTO.idioma,
            volumen_musica ?? null,
            idioma ?? null,
        ]
    );
    return obtener(idUsuario);
}

// "Añadir +": guarda una copia de la configuración actual con un nombre
async function crearPerfil(idUsuario, nombre) {
    const perfiles = await listarPerfiles(idUsuario);

    if (perfiles.length >= MAX_PERFILES) {
        throw crearError(409, 'Ya tenés 3 perfiles: borrá uno para añadir otro');
    }
    if (perfiles.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase())) {
        throw crearError(409, 'Ya tenés un perfil con ese nombre');
    }

    // Primer slot libre (1, 2 o 3)
    const usados = new Set(perfiles.map((p) => p.slot));
    let slot = 1;
    while (usados.has(slot)) slot++;

    const actual = await obtenerActual(idUsuario);

    try {
        await db.execute(
            `INSERT INTO CONFIGURACION_PERFILES (id_usuario, slot, nombre, volumen_musica, idioma)
             VALUES (?, ?, ?, ?, ?)`,
            [idUsuario, slot, nombre, actual.volumen_musica, actual.idioma]
        );
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw crearError(409, 'No se pudo guardar el perfil, probá de nuevo');
        }
        throw error;
    }

    return obtener(idUsuario);
}

// Tocar un perfil: sus valores pasan a ser la configuración actual
async function aplicarPerfil(idUsuario, idPerfil) {
    const [rows] = await db.execute(
        `SELECT volumen_musica, idioma
         FROM CONFIGURACION_PERFILES WHERE id_perfil = ? AND id_usuario = ?`,
        [idPerfil, idUsuario]
    );
    if (!rows.length) {
        throw crearError(404, 'Perfil inexistente');
    }
    return actualizar(idUsuario, rows[0]);
}

// La X: borra el perfil (la configuración actual no cambia)
async function borrarPerfil(idUsuario, idPerfil) {
    const [resultado] = await db.execute(
        'DELETE FROM CONFIGURACION_PERFILES WHERE id_perfil = ? AND id_usuario = ?',
        [idPerfil, idUsuario]
    );
    if (resultado.affectedRows === 0) {
        throw crearError(404, 'Perfil inexistente');
    }
    return obtener(idUsuario);
}

module.exports = { obtener, actualizar, crearPerfil, aplicarPerfil, borrarPerfil };