const db = require('../config/database');

const TOTAL_NIVELES = Number(process.env.TOTAL_NIVELES);

function crearError(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

// Primer nivel sin completar; null si ya los completó todos
function calcularNivelActual(filas) {
    const completados = new Set(
        filas.filter((f) => f.completado).map((f) => f.id_nivel)
    );
    for (let n = 1; n <= TOTAL_NIVELES; n++) {
        if (!completados.has(n)) return n;
    }
    return null;
}

// LA VISTA: estado de todos los niveles de este jugador
async function obtenerProgreso(idUsuario) {
    const [filas] = await db.execute(
        'SELECT id_nivel, completado FROM PROGRESO_NIVELES WHERE id_usuario = ?',
        [idUsuario]
    );

    const nivelActual = calcularNivelActual(filas);
    const estado = new Map(filas.map((f) => [f.id_nivel, Boolean(f.completado)]));

    const niveles = [];
    for (let n = 1; n <= TOTAL_NIVELES; n++) {
        niveles.push({
            id_nivel: n,
            completado: estado.get(n) === true,
            iniciado: estado.has(n),
            desbloqueado: nivelActual === null || n <= nivelActual,
        });
    }

    return { nivelActual, juegoCompletado: nivelActual === null, niveles };
}

async function tienePermiso(idUsuario, clave) {
    const [rows] = await db.execute(
        `SELECT 1
         FROM USUARIO_ROLES ur
         JOIN ROL_SERVICIOS rs ON rs.id_rol = ur.id_rol
         JOIN SERVICIOS s ON s.id_servicio = rs.id_servicio
         WHERE ur.id_usuario = ? AND s.clave = ?
         LIMIT 1`,
        [idUsuario, clave]
    );
    return rows.length > 0;
}

// Valida que el nivel exista y que el jugador ya lo tenga desbloqueado
async function validarAcceso(idUsuario, idNivel) {
    if (idNivel > TOTAL_NIVELES) {
        throw crearError(404, 'Nivel inexistente');
    }

    // Quien tenga este permiso puede entrar a cualquier nivel
    if (await tienePermiso(idUsuario, 'desbloquear_niveles')) {
        return;
    }

    const { nivelActual } = await obtenerProgreso(idUsuario);
    if (nivelActual !== null && idNivel > nivelActual) {
        throw crearError(403, 'Nivel bloqueado: completá el anterior primero');
    }
}

// EL JUEGO AVISA: el jugador entró a un nivel
async function iniciar(idUsuario, idNivel) {
    await validarAcceso(idUsuario, idNivel);

    // Si ya existe la fila no se toca (así no se "descompleta" un nivel ya terminado)
    await db.execute(
        `INSERT INTO PROGRESO_NIVELES (id_usuario, id_nivel, completado)
         VALUES (?, ?, 0)
         ON DUPLICATE KEY UPDATE completado = completado`,
        [idUsuario, idNivel]
    );

    return obtenerProgreso(idUsuario);
}

// EL JUEGO AVISA: el jugador terminó un nivel
async function completar(idUsuario, idNivel) {
    await validarAcceso(idUsuario, idNivel);

    await db.execute(
        `INSERT INTO PROGRESO_NIVELES (id_usuario, id_nivel, completado)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE completado = 1`,
        [idUsuario, idNivel]
    );

    return obtenerProgreso(idUsuario);
}

module.exports = { obtenerProgreso, iniciar, completar };