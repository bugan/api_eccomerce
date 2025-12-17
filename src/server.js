require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const logger = require('./config/logger');
const httpLogger = require('./middlewares/httpLogger');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

// Rotas
const authRoutes = require('./modules/auth/authRoutes');
const cartRoutes = require('./modules/cart/cartRoutes');
const productRoutes = require('./modules/products/productRoutes');
const orderRoutes = require('./modules/orders/orderRoutes');
const paymentRoutes = require('./modules/payments/paymentRoutes');
const categoryRoutes = require('./modules/categories/categoryRoutes');
const userRoutes = require('./modules/users/userRoutes');
const couponRoutes = require('./modules/coupons/couponRoutes');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de Segurança e Performance
app.use(helmet());
app.use(compression());
app.use(cors()); // Configurável por tenant futuramente
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(httpLogger);

// Documentação Swagger (se houver arquivo swagger.yaml)
// const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Healthcheck
app.get('/health', async (req, res) => {
    // Adicionar checks reais de DB e Redis aqui
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// APIs v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cart', authMiddleware, cartRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/coupons', couponRoutes);

// 404 Handler
app.use((req, res, next) => {
    next(new AppError(`Rota não encontrada: ${req.originalUrl}`, 404, 'RESOURCE_NOT_FOUND'));
});

// Global Error Handler
app.use(errorHandler);

// Server Start (apenas se não for teste)
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
}

module.exports = app;
