const express = require('express');
const cartController = require('./cartController');

const router = express.Router();

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.delete('/items/:itemId', cartController.removeItem);
router.post('/coupon', cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);

module.exports = router;
