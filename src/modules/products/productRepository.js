const prisma = require('../../config/database');

const productRepository = {
    create: async (data) => {
        return await prisma.product.create({ data });
    },

    update: async (id, data) => {
        return await prisma.product.update({
            where: { id },
            data
        });
    },

    delete: async (id) => {
        return await prisma.product.delete({ where: { id } });
    },

    findById: async (id) => {
        return await prisma.product.findUnique({
            where: { id },
            include: { category: true }
        });
    },

    findBySku: async (sku) => {
        return await prisma.product.findUnique({ where: { sku } });
    },

    findAll: async ({ skip, take, categoryId, search }) => {
        const where = {
            status: 'ACTIVE'
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { category: true }
            }),
            prisma.product.count({ where })
        ]);

        return { products, total };
    }
};

module.exports = productRepository;
