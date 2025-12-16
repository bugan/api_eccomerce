const express = require('express');
const cartController = require('./cartController');
// Importar middleware de auth quando estiver pronto para proteger rotas
// const authMiddleware = require('../../middlewares/authMiddleware');

const router = express.Router();

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.delete('/items/:itemId', cartController.removeItem);

module.exports = router;
