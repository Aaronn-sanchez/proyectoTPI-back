const bcrypt = require('bcrypt');
const db = require('../config/database');
const jwt = require('jsonwebtoken')

require('dotenv').config()

const { TOKEN_SECRET } = process.env;

console.log(TOKEN_SECRET)

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

    // return crearToken({ nombre, email, id: result.insertId })

    return (email, password, nombre)

}

function crearToken(usuario) {
    const token = jwt.sign(usuario, TOKEN_SECRET)

    console.log(token)
}

module.exports = { register };