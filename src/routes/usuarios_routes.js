const router = require('express').Router();
const c = require('../controllers/usuarios_controller');
const auth = require('../middleware/auth');
const requiereServicio = require('../middleware/requiereServicio');

router.use(auth, requiereServicio('gestionar_roles'));

router.get('/', c.listar);
router.get('/:id/roles', c.listarRoles);
router.post('/:id/roles', c.asignarRol);
router.delete('/:id/roles/:idRol', c.quitarRol);
router.delete('/:id', c.deshabilitar);

module.exports = router;