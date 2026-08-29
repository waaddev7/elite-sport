// controllers/categoryController.js
const { Category, Product } = require('../models');

const categoryController = {
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      const category = await Category.create({ name });
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async getAllCategories(req, res) {
    try {
      const categories = await Category.findAll({
        include: [{
          model: Product,
          as: 'products'
        }]
      });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async getCategoryById(req, res) {
    try {
      const category = await Category.findByPk(req.params.id, {
        include: [{
          model: Product,
          as: 'products'
        }]
      });
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async updateCategory(req, res) {
    try {
      const { name } = req.body;
      const category = await Category.findByPk(req.params.id);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      await category.update({ name });
      res.json({
        message: 'Category updated successfully',
        category
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async deleteCategory(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      await category.destroy();
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = categoryController;