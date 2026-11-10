const router = require('express').Router();
const controller = require('../controllers/auth_controller');
const auth = require('../middleware/auth');
const soloRol = require('../middleware/soloRol');

const ROL_QA = Number(process.env.ROL_QA) || 2;

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', auth, controller.me);
router.get('/qa/check', auth, soloRol(ROL_QA), controller.qaCheck);

module.exports = router;