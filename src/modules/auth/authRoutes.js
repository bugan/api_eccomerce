const express = require('express');
const authController = require('./authController');
const { registerValidator, loginValidator } = require('./authValidators');
const validateRequest = require('../../middlewares/validateRequest');

const router = express.Router();

router.post('/register', registerValidator, validateRequest, authController.register);
router.post('/login', loginValidator, validateRequest, authController.login);

module.exports = router;
