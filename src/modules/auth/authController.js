const authService = require('./authService');

const authController = {
    register: async (req, res, next) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({
                data: result,
                meta: { timestamp: new Date().toISOString() }
            });
        } catch (error) {
            next(error);
        }
    },

    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.status(200).json({
                data: result,
                meta: { timestamp: new Date().toISOString() }
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
