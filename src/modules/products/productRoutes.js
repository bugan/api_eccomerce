const express = require('express');
const productController = require('./productController');
const authMiddleware = require('../../middlewares/authMiddleware');
const AppError = require('../../utils/AppError');

const router = express.Router();

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return next(new AppError('Requer privilégios de Administrador', 403, 'FORBIDDEN'));
    }
    next();
};

// Public Routes
router.get('/', productController.list);
router.get('/:id', productController.getById);

// Protected Routes (Admin)
router.use(authMiddleware);
router.post('/', adminOnly, productController.create);
router.put('/:id', adminOnly, productController.update);
router.delete('/:id', adminOnly, productController.delete);

module.exports = router;
