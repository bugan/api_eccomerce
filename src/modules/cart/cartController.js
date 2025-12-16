const cartService = require('./cartService');

const cartController = {
    getCart: async (req, res, next) => {
        try {
            // Assumindo que o userId vem do middleware de autenticação (req.user.id)
            // Como ainda não implementei o middleware Auth completo, vou pegar do header ou mockar por enquanto se não tiver
            const userId = req.user ? req.user.sub : req.query.userId;

            if (!userId) { // Fallback temporário para testes
                return res.status(400).json({ error: 'UserId required' });
            }

            const cart = await cartService.getCart(userId);
            res.json({ data: cart });
        } catch (error) {
            next(error);
        }
    },

    addItem: async (req, res, next) => {
        try {
            const userId = req.user ? req.user.sub : req.query.userId;
            if (!userId) return res.status(400).json({ error: 'UserId required' });

            const cart = await cartService.addItem(userId, req.body);
            res.json({ data: cart });
        } catch (error) {
            next(error);
        }
    },

    removeItem: async (req, res, next) => {
        try {
            const userId = req.user ? req.user.sub : req.query.userId;
            const { itemId } = req.params;

            if (!userId) return res.status(400).json({ error: 'UserId required' });

            const cart = await cartService.removeItem(userId, itemId);
            res.json({ data: cart });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = cartController;
