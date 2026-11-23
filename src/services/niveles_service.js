const db = require('../config/database');
const { tieneServicio } = require('./permisos_service');

// Id del último nivel. Tutorial = 0 y 4 niveles más => vale 4 (ids 0 a 4).
const TOTAL_NIVELES = Number(process.env.TOTAL_NIVELES);
if (!Number.isInteger(TOTAL_NIVELES) || TOTAL_NIVELES < 1) {
    throw new Error('TOTAL_NIVELES inválido o ausente en el .env');
}

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
    for (let n = 0; n <= TOTAL_NIVELES; n++) {
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
    const desbloquearTodo = await tieneServicio(idUsuario, 'desbloquear_niveles');

    const niveles = [];
    for (let n = 0; n <= TOTAL_NIVELES; n++) {
        niveles.push({
            id_nivel: n,
            completado: estado.get(n) === true,
            iniciado: estado.has(n),
            desbloqueado: desbloquearTodo || nivelActual === null || n <= nivelActual,
        });
    }

    return { nivelActual, juegoCompletado: nivelActual === null, niveles };
}

// Valida que el nivel exista y que el jugador lo tenga desbloqueado
// (usa la misma regla que el mapa, incluido el permiso desbloquear_niveles)
async function validarAcceso(idUsuario, idNivel) {
    if (idNivel > TOTAL_NIVELES) {
        throw crearError(404, 'Nivel inexistente');
    }

    const { niveles } = await obtenerProgreso(idUsuario);
    if (!niveles[idNivel].desbloqueado) {
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

    // Solo se puede completar un nivel que el jugador entró a jugar
    const [filas] = await db.execute(
        'SELECT 1 FROM PROGRESO_NIVELES WHERE id_usuario = ? AND id_nivel = ?',
        [idUsuario, idNivel]
    );
    if (!filas.length) {
        throw crearError(409, 'Tenés que iniciar el nivel antes de completarlo');
    }

    await db.execute(
        'UPDATE PROGRESO_NIVELES SET completado = 1 WHERE id_usuario = ? AND id_nivel = ?',
        [idUsuario, idNivel]
    );

    return obtenerProgreso(idUsuario);
}

module.exports = { obtenerProgreso, iniciar, completar };