const router = require('express').Router();
const controller = require('../controllers/productos.controller');

router.get('/', controller.getProductos);
router.post('/', controller.createProducto);

module.exports = router;