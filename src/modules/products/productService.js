const productRepository = require('./productRepository');
const redisClient = require('../../config/redis');
const AppError = require('../../utils/AppError');

const CACHE_TTL = 60; // 60 segundos

const productService = {
    createProduct: async (data) => {
        const existing = await productRepository.findBySku(data.sku);
        if (existing) {
            throw new AppError('SKU já existe', 409, 'CONFLICT');
        }
        return await productRepository.create(data);
    },

    updateProduct: async (id, data) => {
        const product = await productRepository.findById(id);
        if (!product) throw new AppError('Produto não encontrado', 404, 'RESOURCE_NOT_FOUND');

        if (data.sku && data.sku !== product.sku) {
            const existing = await productRepository.findBySku(data.sku);
            if (existing) throw new AppError('SKU já existe', 409, 'CONFLICT');
        }

        return await productRepository.update(id, data);
    },

    deleteProduct: async (id) => {
        try {
            await productRepository.delete(id);
        } catch (e) {
            if (e.code === 'P2025') throw new AppError('Produto não encontrado', 404, 'RESOURCE_NOT_FOUND');
            throw e;
        }
    },

    getProductById: async (id) => {
        const product = await productRepository.findById(id);
        if (!product) throw new AppError('Produto não encontrado', 404, 'RESOURCE_NOT_FOUND');
        return product;
    },

    listProducts: async (query) => {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;
        const { categoryId, search } = query;

        // Cache Key baseada nos parâmetros
        const cacheKey = `products:list:${JSON.stringify({ page, limit, categoryId, search })}`;

        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('Redis Error', err);
        }

        const { products, total } = await productRepository.findAll({
            skip,
            take: limit,
            categoryId,
            search
        });

        const result = {
            data: products,
            pagination: {
                page,
                limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit)
            }
        };

        // Salvar no Cache
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: CACHE_TTL });

        return result;
    }
};

module.exports = productService;
