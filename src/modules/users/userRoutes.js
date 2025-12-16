const express = require('express');
const userController = require('./userController');
const authMiddleware = require('../../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/:id', userController.getProfile);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

module.exports = router;
