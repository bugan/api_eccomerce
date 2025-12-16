const prisma = require('../../config/database');

const categoryRepository = {
    create: async (data) => {
        return await prisma.category.create({ data });
    },

    update: async (id, data) => {
        return await prisma.category.update({ where: { id }, data });
    },

    delete: async (id) => {
        return await prisma.category.delete({ where: { id } });
    },

    findAll: async () => { // Include hierarchy
        // Prisma não faz tree recursivo nativo fácil no findMany normal, 
        // mas podemos carregar children nivel 1
        return await prisma.category.findMany({
            include: { children: true }
        });
    },

    findById: async (id) => {
        return await prisma.category.findUnique({ where: { id }, include: { children: true } });
    }
};

module.exports = categoryRepository;
