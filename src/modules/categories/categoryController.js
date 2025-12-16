const categoryService = require('./categoryService');

const categoryController = {
    list: async (req, res, next) => {
        try {
            const data = await categoryService.listCategories();
            res.json({ data });
        } catch (error) { next(error); }
    },

    getById: async (req, res, next) => {
        try {
            const data = await categoryService.getCategoryById(req.params.id);
            res.json({ data });
        } catch (error) { next(error); }
    },

    create: async (req, res, next) => {
        try {
            const data = await categoryService.createCategory(req.body);
            res.status(201).json({ data });
        } catch (error) { next(error); }
    },

    update: async (req, res, next) => {
        try {
            const data = await categoryService.updateCategory(req.params.id, req.body);
            res.json({ data });
        } catch (error) { next(error); }
    },

    delete: async (req, res, next) => {
        try {
            await categoryService.deleteCategory(req.params.id);
            res.status(204).send();
        } catch (error) { next(error); }
    }
};

module.exports = categoryController;
