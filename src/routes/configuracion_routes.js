const router = require('express').Router();
const controller = require('../controllers/configuracion_controller');
const auth = require('../middleware/auth');

router.get('/', auth, controller.obtener);
router.patch('/', auth, controller.actualizar);

router.post('/perfiles', auth, controller.crearPerfil);
router.post('/perfiles/:id/aplicar', auth, controller.aplicarPerfil);
router.delete('/perfiles/:id', auth, controller.borrarPerfil);

module.exports = router;