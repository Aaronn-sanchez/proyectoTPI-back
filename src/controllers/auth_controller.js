const servicios = require("../services/auth_service")

async function register(req, res, next) {
    const { nombre, email, pass } = req.body;

    const response = await servicios.register(nombre, email, pass)

    console.log(response)

    res.send("papa")
}

module.exports = { register }