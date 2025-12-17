const couponRepository = require('./couponRepository');
const AppError = require('../../utils/AppError');

const couponService = {
    createCoupon: async (data) => {
        const existing = await couponRepository.findByCode(data.code);
        if (existing) throw new AppError('Código de cupom já existe', 409, 'CONFLICT');
        return await couponRepository.create(data);
    },

    listCoupons: async () => {
        return await couponRepository.findAll();
    },

    validateCoupon: async (code, cartTotal) => {
        const coupon = await couponRepository.findByCode(code);

        if (!coupon) {
            throw new AppError('Cupom inválido', 404, 'RESOURCE_NOT_FOUND');
        }

        if (!coupon.active) {
            throw new AppError('Cupom inativo', 400, 'INVALID_PAYLOAD');
        }

        if (new Date() > new Date(coupon.expirationDate)) {
            throw new AppError('Cupom expirado', 400, 'INVALID_PAYLOAD');
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            throw new AppError('Limite de uso do cupom excedido', 400, 'INVALID_PAYLOAD');
        }

        if (coupon.minPurchase && Number(cartTotal) < Number(coupon.minPurchase)) {
            throw new AppError(`Valor mínimo para este cupom é R$ ${coupon.minPurchase}`, 400, 'INVALID_PAYLOAD');
        }

        // Calcular desconto
        let discountValue = 0;
        if (coupon.type === 'PERCENTAGE') {
            discountValue = (Number(cartTotal) * Number(coupon.value)) / 100;
        } else {
            discountValue = Number(coupon.value);
        }

        // Garantir que desconto não seja maior que o total
        if (discountValue > Number(cartTotal)) {
            discountValue = Number(cartTotal);
        }

        return {
            isValid: true,
            coupon,
            discountValue: Number(discountValue.toFixed(2))
        };
    }
};

module.exports = couponService;
