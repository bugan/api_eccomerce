const redisClient = require('../../config/redis');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

const CART_TTL = 30 * 24 * 60 * 60; // 30 dias

const cartService = {
    getCart: async (userId, tenantId = 'default') => {
        const key = `cart:${tenantId}:${userId}`;
        const cartData = await redisClient.get(key);
        return cartData ? JSON.parse(cartData) : { items: [], total: 0 };
    },

    addItem: async (userId, itemData, tenantId = 'default') => {
        const { productId, quantity } = itemData;
        const key = `cart:${tenantId}:${userId}`;

        // Validar Produto e Estoque
        const product = await prisma.product.findUnique({ where: { id: productId } });

        if (!product) {
            throw new AppError('Produto não encontrado', 404, 'RESOURCE_NOT_FOUND');
        }

        if (product.stock < quantity) {
            throw new AppError('Estoque insuficiente', 409, 'OUT_OF_STOCK');
        }

        // Buscar carrinho atual
        let cart = await cartService.getCart(userId, tenantId);

        // Atualizar ou Adicionar Item
        const existingItemIndex = cart.items.findIndex(i => i.productId === productId);

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
            // Re-verificar estoque total
            if (product.stock < cart.items[existingItemIndex].quantity) {
                throw new AppError('Estoque insuficiente para a quantidade total', 409, 'OUT_OF_STOCK');
            }
        } else {
            cart.items.push({
                productId,
                name: product.name,
                price: Number(product.price),
                quantity
            });
        }

        // Recalcular total
        cart.total = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Salvar no Redis
        await redisClient.set(key, JSON.stringify(cart), { EX: CART_TTL });

        return cart;
    },

    removeItem: async (userId, productId, tenantId = 'default') => {
        const key = `cart:${tenantId}:${userId}`;
        let cart = await cartService.getCart(userId, tenantId);

        cart.items = cart.items.filter(item => item.productId !== productId);
        cart.total = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        await redisClient.set(key, JSON.stringify(cart), { EX: CART_TTL });
        return cart;
    }
};

module.exports = cartService;
