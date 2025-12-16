const userService = require('./userService');

const userController = {
    getProfile: async (req, res, next) => {
        try {
            const userId = req.params.id || req.user.sub;
            // Se tentar acessar outro ID e não for admin/proprio, validado no service, 
            // mas aqui podemos forçar o ID do token se for rota /me ou validar permissão de leitura

            // Permitir que admin veja qualquer um, mas user comum so veja a si mesmo
            if (req.user.role !== 'ADMIN' && req.params.id && req.params.id !== req.user.sub) {
                return res.status(403).json({ error: { message: 'Forbidden' } });
            }

            const data = await userService.getProfile(userId);
            res.json({ data });
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            const data = await userService.updateUser(req.params.id, req.body, req.user);
            res.json({ data });
        } catch (error) {
            next(error);
        }
    },

    delete: async (req, res, next) => {
        try {
            await userService.deleteUser(req.params.id, req.user);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

module.exports = userController;
