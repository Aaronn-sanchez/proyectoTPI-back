const router = require('express').Router();
const controller = require('../controllers/logros_controller');
const auth = require('../middleware/auth');

router.get('/', auth, controller.listar);
router.post('/progreso', auth, controller.registrarProgreso);

module.exports = router;