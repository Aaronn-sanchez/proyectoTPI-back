const servicios = require("../services/auth_service")
const zod = require('zod')

function validarDatos() {

}

async function register(req, res, next) {
    try {
        const { nombre, email, pass } = req.body;
        const response = await servicios.register(nombre, email, pass)
        console.log(response)
        res.send("los datos llegaron")

    } catch (error) {
        console.error(error)
        res.send("ocurrio un error")
    }



}

module.exports = { register }