const express = require('express');
const categoryController = require('./categoryController');
const authMiddleware = require('../../middlewares/authMiddleware');
const AppError = require('../../utils/AppError');

const router = express.Router();

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return next(new AppError('Requer privilégios de Administrador', 403, 'FORBIDDEN'));
    }
    next();
};

// Public
router.get('/', categoryController.list);
router.get('/:id', categoryController.getById);

// Admin
router.use(authMiddleware);
router.post('/', adminOnly, categoryController.create);
router.put('/:id', adminOnly, categoryController.update);
router.delete('/:id', adminOnly, categoryController.delete);

module.exports = router;
