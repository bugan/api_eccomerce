const couponService = require('./couponService');

const couponController = {
    create: async (req, res, next) => {
        try {
            const coupon = await couponService.createCoupon(req.body);
            res.status(201).json({ data: coupon });
        } catch (error) { next(error); }
    },

    list: async (req, res, next) => {
        try {
            const coupons = await couponService.listCoupons();
            res.json({ data: coupons });
        } catch (error) { next(error); }
    }
    // Implementar update e delete se necessário
};

module.exports = couponController;
