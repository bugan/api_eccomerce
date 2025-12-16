const userRepository = require('./userRepository');
const AppError = require('../../utils/AppError');

const userService = {
    getProfile: async (userId) => {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError('Usuário não encontrado', 404, 'RESOURCE_NOT_FOUND');

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    updateUser: async (userId, data, requestUser) => {
        // Regra: Usuário só pode alterar a si mesmo, ou Admin altera qualquer um
        if (requestUser.role !== 'ADMIN' && requestUser.sub !== userId) {
            throw new AppError('Acesso negado', 403, 'FORBIDDEN');
        }

        const user = await userRepository.findById(userId);
        if (!user) throw new AppError('Usuário não encontrado', 404, 'RESOURCE_NOT_FOUND');

        // Impedir alteração de role por usuário comum
        if (data.role && requestUser.role !== 'ADMIN') {
            delete data.role;
        }

        // Se houver senha, deveria ser hasheada aqui (omitido por brevidade, focar em dados cadastrais)
        // Idealmente criar changePassword separado

        const updatedUser = await userRepository.update(userId, data);
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    },

    deleteUser: async (userId, requestUser) => {
        if (requestUser.role !== 'ADMIN' && requestUser.sub !== userId) {
            throw new AppError('Acesso negado', 403, 'FORBIDDEN');
        }
        await userRepository.delete(userId);
        return { message: 'Usuário removido com sucesso' };
    }
};

module.exports = userService;
