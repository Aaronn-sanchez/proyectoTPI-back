const bcrypt = require('bcrypt');
const db = require('../config/database');

async function register(nombre, email, password) {
    const passwordHash = await bcrypt.hash(
        password,
        Number(process.env.BCRYPT_ROUNDS) || 10
    );
    /* 
        const [result] = await db.execute(
            `INSERT INTO USUARIOS (email, password_hash, id_rol, nombre_usuario)
         VALUES (?, ?, 1, ?)`,
            [email, passwordHash, nombre]
        ); */

    return {
        id: 0,
        nombre,
        email,
        password,
        passwordHash
    };
}

module.exports = { register };