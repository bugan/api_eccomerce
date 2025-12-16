const categoryRepository = require('./categoryRepository');
const AppError = require('../../utils/AppError');

const categoryService = {
    listCategories: async () => {
        return await categoryRepository.findAll();
    },

    getCategoryById: async (id) => {
        const category = await categoryRepository.findById(id);
        if (!category) throw new AppError('Categoria não encontrada', 404, 'RESOURCE_NOT_FOUND');
        return category;
    },

    createCategory: async (data) => {
        return await categoryRepository.create(data);
    },

    updateCategory: async (id, data) => {
        await categoryService.getCategoryById(id); // Checa existência
        // Webhook: category.updated -> Simulado
        return await categoryRepository.update(id, data);
    },

    deleteCategory: async (id) => {
        try {
            await categoryRepository.delete(id);
        } catch (e) {
            // Prisma error P2003 (FK constraint) se tiver produtos
            if (e.code === 'P2003') throw new AppError('Não é possível excluir categoria com produtos associados', 409, 'CONFLICT');
            throw e;
        }
    }
};

module.exports = categoryService;
