const productService = require('./productService');

const productController = {
    list: async (req, res, next) => {
        try {
            const result = await productService.listProducts(req.query);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    getById: async (req, res, next) => {
        try {
            const product = await productService.getProductById(req.params.id);
            res.json({ data: product });
        } catch (error) {
            next(error);
        }
    },

    create: async (req, res, next) => {
        try {
            const product = await productService.createProduct(req.body);
            res.status(201).json({ data: product });
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        try {
            const product = await productService.updateProduct(req.params.id, req.body);
            res.json({ data: product });
        } catch (error) {
            next(error);
        }
    },

    delete: async (req, res, next) => {
        try {
            await productService.deleteProduct(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
};

module.exports = productController;
