const router = require('express').Router();
const controller = require('../controllers/logros_controller');
const auth = require('../middleware/auth');
const requiere_servicios = requiere('../middleware/requiereServicio')

router.get('/', auth, controller.listar);
router.post('/progreso', auth, controller.registrarProgreso);

router.delete(
    '/reset',
    auth,
    requiereServicio('resetear_logros'),
    controller.resetear
);

module.exports = router;