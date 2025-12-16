const prisma = require('../../config/database');

const paymentRepository = {
    create: async (data) => {
        return await prisma.payment.create({ data });
    },

    findByOrderId: async (orderId) => {
        return await prisma.payment.findUnique({ where: { orderId } });
    },

    findById: async (id) => {
        return await prisma.payment.findUnique({ where: { id }, include: { order: true } });
    },

    updateStatus: async (id, status, externalId) => {
        return await prisma.payment.update({
            where: { id },
            data: {
                status,
                externalId,
                updatedAt: new Date()
            }
        });
    }
};

module.exports = paymentRepository;
