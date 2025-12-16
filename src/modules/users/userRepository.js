const prisma = require('../../config/database');

const userRepository = {
    create: async (userData) => {
        return await prisma.user.create({
            data: userData
        });
    },

    findByEmail: async (email) => {
        return await prisma.user.findUnique({
            where: { email }
        });
    },

    findById: async (id) => {
        return await prisma.user.findUnique({
            where: { id }
        });
    },

    findAll: async (skip = 0, take = 20) => {
        return await prisma.user.findMany({
            skip,
            take,
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
    },

    update: async (id, data) => {
        return await prisma.user.update({
            where: { id },
            data
        });
    },

    delete: async (id) => {
        return await prisma.user.delete({
            where: { id }
        });
    }
};

module.exports = userRepository;
