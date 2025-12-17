const redisClient = require('../../config/redis');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
// Lazy load do couponService dentro das funções para evitar problemas de inicilização circular se houver, mas aqui vou importar no topo se possivel. 
// Como couponService é autônomo, ok.
const couponService = require('../coupons/couponService');

const CART_TTL = 30 * 24 * 60 * 60; // 30 dias

const saveCart = async (key, cart) => {
    // Recalcular Subtotal
    cart.subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Recalcular Desconto se tiver cupom
    if (cart.couponCode) {
        try {
            const { discountValue } = await couponService.validateCoupon(cart.couponCode, cart.subtotal);
            cart.discount = discountValue;
        } catch (error) {
            // Se cupom não é mais válido (ex: valor caiu abaixo do minimo), remove
            cart.couponCode = null;
            cart.discount = 0;
            cart.message = `Cupom removido: ${error.message}`;
        }
    } else {
        cart.discount = 0;
    }

    cart.total = cart.subtotal - cart.discount;
    if (cart.total < 0) cart.total = 0;

    await redisClient.set(key, JSON.stringify(cart), { EX: CART_TTL });
    return cart;
};

const cartService = {
    getCart: async (userId, tenantId = 'default') => {
        const key = `cart:${tenantId}:${userId}`;
        const cartData = await redisClient.get(key);
        return cartData ? JSON.parse(cartData) : { items: [], subtotal: 0, discount: 0, total: 0, couponCode: null };
    },

    addItem: async (userId, itemData, tenantId = 'default') => {
        const { productId, quantity } = itemData;
        const key = `cart:${tenantId}:${userId}`;

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new AppError('Produto não encontrado', 404, 'RESOURCE_NOT_FOUND');
        if (product.stock < quantity) throw new AppError('Estoque insuficiente', 409, 'OUT_OF_STOCK');

        let cart = await cartService.getCart(userId, tenantId);

        const existingItemIndex = cart.items.findIndex(i => i.productId === productId);
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
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

        return await saveCart(key, cart);
    },

    removeItem: async (userId, productId, tenantId = 'default') => {
        const key = `cart:${tenantId}:${userId}`;
        let cart = await cartService.getCart(userId, tenantId);

        cart.items = cart.items.filter(item => item.productId !== productId);

        return await saveCart(key, cart);
    },

    applyCoupon: async (userId, couponCode, tenantId = 'default') => {
        const key = `cart:${tenantId}:${userId}`;
        let cart = await cartService.getCart(userId, tenantId);

        if (cart.items.length === 0) {
            throw new AppError('Carrinho vazio', 400, 'INVALID_PAYLOAD');
        }

        // Calcular subtotal atual
        const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Validar cupom
        const { discountValue } = await couponService.validateCoupon(couponCode, subtotal);

        // Aplicar
        cart.couponCode = couponCode;
        cart.discount = discountValue;
        cart.subtotal = subtotal;
        cart.total = subtotal - discountValue;

        await redisClient.set(key, JSON.stringify(cart), { EX: CART_TTL });
        return cart;
    },

    removeCoupon: async (userId, tenantId = 'default') => {
        const key = `cart:${tenantId}:${userId}`;
        let cart = await cartService.getCart(userId, tenantId);

        cart.couponCode = null;
        return await saveCart(key, cart);
    }
};

module.exports = cartService;
