const router = require('express').Router();
const controller = require('../controllers/niveles_controller');
const auth = require('../middleware/auth');

router.get('/', auth, controller.obtener);
router.post('/iniciar', auth, controller.iniciar);
router.post('/completar', auth, controller.completar);

module.exports = router;