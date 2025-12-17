const cartService = require('./cartService');

const cartController = {
    getCart: async (req, res, next) => {
        try {
            const userId = req.user ? req.user.sub : req.query.userId;
            if (!userId) return res.status(400).json({ error: 'UserId required' });

            const cart = await cartService.getCart(userId);
            res.json({ data: cart });
        } catch (error) { next(error); }
    },

    addItem: async (req, res, next) => {
        try {
            const userId = req.user ? req.user.sub : req.query.userId;
            if (!userId) return res.status(400).json({ error: 'UserId required' });

            const cart = await cartService.addItem(userId, req.body);
            res.json({ data: cart });
        } catch (error) { next(error); }
    },

    removeItem: async (req, res, next) => {
        try {
            const userId = req.user ? req.user.sub : req.query.userId;
            if (!userId) return res.status(400).json({ error: 'UserId required' });

            const cart = await cartService.removeItem(userId, req.params.itemId);
            res.json({ data: cart });
        } catch (error) { next(error); }
    },

    applyCoupon: async (req, res, next) => {
        try {
            const userId = req.user ? req.user.sub : req.query.userId;
            const { code } = req.body;
            if (!userId) return res.status(400).json({ error: 'UserId required' });
            if (!code) return res.status(400).json({ error: 'Coupon code required' });

            const cart = await cartService.applyCoupon(userId, code);
            res.json({ data: cart });
        } catch (error) { next(error); }
    },

    removeCoupon: async (req, res, next) => {
        try {
            const userId = req.user ? req.user.sub : req.query.userId;
            const cart = await cartService.removeCoupon(userId);
            res.json({ data: cart });
        } catch (error) { next(error); }
    }
};

module.exports = cartController;
