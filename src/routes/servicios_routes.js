const router = require('express').Router();
const c = require('../controllers/roles_controller');
const auth = require('../middleware/auth');
const requiereServicio = require('../middleware/requiereServicio');

router.get('/', auth, requiereServicio('gestionar_roles'), c.listarServicios);

module.exports = router;