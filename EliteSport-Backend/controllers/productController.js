// controllers/productController.js
const { Product, Category, OrderItem } = require('../models');

const productController = {
  async createProduct(req, res) {
    try {
      const { name, description, price, stock, category_id } = req.body;
      
      // Check if category exists
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      const product = await Product.create({
        name,
        description,
        price,
        stock,
        category_id
      });
      
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async getAllProducts(req, res) {
    try {
      const { category_id, minPrice, maxPrice, inStock } = req.query;
      const where = {};
      
      if (category_id) where.category_id = category_id;
      if (minPrice) where.price = { [Op.gte]: minPrice };
      if (maxPrice) where.price = { [Op.lte]: maxPrice };
      if (inStock === 'true') where.stock = { [Op.gt]: 0 };
      
      const products = await Product.findAll({
        where,
        include: [{
          model: Category,
          as: 'category'
        }]
      });
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async getProductById(req, res) {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: [
          { model: Category, as: 'category' },
          { model: OrderItem, as: 'order_items' }
        ]
      });
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async updateProduct(req, res) {
    try {
      const { name, description, price, stock, category_id } = req.body;
      const product = await Product.findByPk(req.params.id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      if (category_id) {
        const category = await Category.findByPk(category_id);
        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }
      }
      
      await product.update({
        name,
        description,
        price,
        stock,
        category_id
      });
      
      res.json({
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async deleteProduct(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      await product.destroy();
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async updateStock(req, res) {
    try {
      const { stock } = req.body;
      const product = await Product.findByPk(req.params.id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      await product.update({ stock });
      res.json({
        message: 'Stock updated successfully',
        product
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = productController;