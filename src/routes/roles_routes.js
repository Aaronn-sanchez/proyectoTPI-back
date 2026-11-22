const router = require('express').Router();
const c = require('../controllers/roles_controller');
const auth = require('../middleware/auth');
const requiereServicio = require('../middleware/requiereServicio');

router.use(auth, requiereServicio('gestionar_roles'));

router.get('/', c.listar);
router.post('/', c.crear);
router.get('/:id', c.obtener);
router.put('/:id', c.renombrar);
router.delete('/:id', c.borrar);

router.put('/:id/servicios', c.reemplazarServicios);
router.post('/:id/servicios', c.agregarServicio);
router.delete('/:id/servicios/:idServicio', c.quitarServicio);

module.exports = router;