const prisma = require('../../config/database');

const couponRepository = {
    create: async (data) => {
        return await prisma.coupon.create({ data });
    },

    findByCode: async (code) => {
        return await prisma.coupon.findUnique({ where: { code } });
    },

    findById: async (id) => {
        return await prisma.coupon.findUnique({ where: { id } });
    },

    findAll: async () => {
        return await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    },

    update: async (id, data) => {
        return await prisma.coupon.update({ where: { id }, data });
    },

    delete: async (id) => {
        return await prisma.coupon.delete({ where: { id } });
    },

    incrementUsage: async (id, tx = prisma) => {
        return await tx.coupon.update({
            where: { id },
            data: { usageCount: { increment: 1 } }
        });
    }
};

module.exports = couponRepository;
