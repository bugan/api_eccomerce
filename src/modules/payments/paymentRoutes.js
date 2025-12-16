const express = require('express');
const paymentController = require('./paymentController');
const authMiddleware = require('../../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', paymentController.create);
router.post('/:id/confirm', paymentController.confirm);
router.post('/:id/cancel', paymentController.cancel);

module.exports = router;
