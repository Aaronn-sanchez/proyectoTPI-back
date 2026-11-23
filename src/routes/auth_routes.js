const router = require('express').Router();
const controller = require('../controllers/auth_controller');
const auth = require('../middleware/auth');
const requiereServicio = require('../middleware/requiereServicio');

router.post('/register', controller.register);
router.post('/login', controller.login);

router.get('/me', auth, controller.me);
router.patch('/me', auth, controller.actualizarNombre);
router.delete('/me', auth, controller.eliminarCuenta);

router.get('/qa/check', auth, requiereServicio('desbloquear_niveles'), controller.qaCheck);

module.exports = router;