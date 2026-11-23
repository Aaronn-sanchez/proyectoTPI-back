const router = require('express').Router();
const c = require('../controllers/checkpoint_controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', c.listar);          // ?nivel=0
router.get('/ultimo', c.ultimo);    // ?nivel=0  (va antes de /:id)
router.get('/:id', c.obtener);
router.post('/', c.crear);
router.put('/:id', c.reescribir);
router.delete('/:id', c.borrar);

module.exports = router;