const db = require('../config/database');

const POR_DEFECTO = { volumen_musica: 100, idioma: 0 };
const MAX_PERFILES = 3;
const NOMBRE_AUTO = 'Mi configuración';

function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

// La configuración actual es el perfil activo; sin ninguno, valores por defecto
async function obtenerActual(idUsuario) {
    const [rows] = await db.execute(
        `SELECT volumen_musica, idioma FROM CONFIGURACION_PERFILES
         WHERE id_usuario = ? AND es_activo = 1`,
        [idUsuario]
    );
    return rows[0] || POR_DEFECTO;
}

async function listarPerfiles(idUsuario) {
    const [rows] = await db.execute(
        `SELECT id_perfil, slot, nombre, volumen_musica, idioma, es_activo
         FROM CONFIGURACION_PERFILES WHERE id_usuario = ? ORDER BY slot`,
        [idUsuario]
    );
    return rows.map((p) => ({ ...p, es_activo: Boolean(p.es_activo) }));
}

async function obtener(idUsuario) {
    const configuracion = await obtenerActual(idUsuario);
    const perfiles = await listarPerfiles(idUsuario);
    return { configuracion, perfiles, maxPerfiles: MAX_PERFILES };
}

// Inserta un perfil en el primer slot libre (compartido por crearPerfil y actualizar)
async function insertarPerfil(idUsuario, perfiles, nombre, valores, activo) {
    if (perfiles.length >= MAX_PERFILES) {
        throw crearError(409, 'Ya tenés 3 perfiles: borrá uno para añadir otro');
    }
    const usados = new Set(perfiles.map((p) => p.slot));
    let slot = 1;
    while (usados.has(slot)) slot++;

    try {
        await db.execute(
            `INSERT INTO CONFIGURACION_PERFILES
             (id_usuario, slot, nombre, volumen_musica, idioma, es_activo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [idUsuario, slot, nombre, valores.volumen_musica, valores.idioma, activo ? 1 : 0]
        );
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw crearError(409, 'No se pudo guardar el perfil, probá de nuevo');
        }
        throw error;
    }
}

// Slider / idioma: modifica el perfil activo. Si no hay, crea uno activo.
async function actualizar(idUsuario, { volumen_musica, idioma }) {
    const perfiles = await listarPerfiles(idUsuario);
    const activo = perfiles.find((p) => p.es_activo);

    if (activo) {
        await db.execute(
            `UPDATE CONFIGURACION_PERFILES
             SET volumen_musica = COALESCE(?, volumen_musica),
                 idioma         = COALESCE(?, idioma)
             WHERE id_perfil = ? AND id_usuario = ?`,
            [volumen_musica ?? null, idioma ?? null, activo.id_perfil, idUsuario]
        );
        return obtener(idUsuario);
    }

    if (perfiles.length >= MAX_PERFILES) {
        throw crearError(409, 'Elegí un perfil para modificar su configuración');
    }

    // Nombre único: "Mi configuración", "Mi configuración 2", ...
    const nombres = new Set(perfiles.map((p) => p.nombre.toLowerCase()));
    let nombre = NOMBRE_AUTO;
    for (let i = 2; nombres.has(nombre.toLowerCase()); i++) {
        nombre = `${NOMBRE_AUTO} ${i}`;
    }

    await insertarPerfil(idUsuario, perfiles, nombre, {
        volumen_musica: volumen_musica ?? POR_DEFECTO.volumen_musica,
        idioma: idioma ?? POR_DEFECTO.idioma,
    }, true);

    return obtener(idUsuario);
}

// "Añadir +": copia la configuración actual (queda inactiva)
async function crearPerfil(idUsuario, nombre) {
    const perfiles = await listarPerfiles(idUsuario);

    if (perfiles.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase())) {
        throw crearError(409, 'Ya tenés un perfil con ese nombre');
    }

    const actual = await obtenerActual(idUsuario);
    await insertarPerfil(idUsuario, perfiles, nombre, actual, false);

    return obtener(idUsuario);
}

// Tocar un perfil: pasa a ser el activo (transacción, así nunca hay dos activos)
async function aplicarPerfil(idUsuario, idPerfil) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.execute(
            'SELECT id_perfil FROM CONFIGURACION_PERFILES WHERE id_perfil = ? AND id_usuario = ?',
            [idPerfil, idUsuario]
        );
        if (!rows.length) {
            throw crearError(404, 'Perfil inexistente');
        }

        await conn.execute(
            'UPDATE CONFIGURACION_PERFILES SET es_activo = 0 WHERE id_usuario = ?',
            [idUsuario]
        );
        await conn.execute(
            'UPDATE CONFIGURACION_PERFILES SET es_activo = 1 WHERE id_perfil = ? AND id_usuario = ?',
            [idPerfil, idUsuario]
        );

        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }

    return obtener(idUsuario);
}

// La X: borra el perfil. Si era el activo, la config vuelve a los valores por defecto.
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