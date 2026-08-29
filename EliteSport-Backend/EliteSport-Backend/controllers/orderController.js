// controllers/orderController.js
const { Order, User, OrderItem, Product } = require('../models');
const { Op } = require('sequelize');

const orderController = {
  async createOrder(req, res) {
    try {
      const { items } = req.body; // items: [{product_id, quantity}]
      
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item' });
      }
      
      let total_amount = 0;
      const orderItems = [];
      
      // Calculate total and check stock
      for (const item of items) {
        const product = await Product.findByPk(item.product_id);
        
        if (!product) {
          return res.status(404).json({ error: `Product ${item.product_id} not found` });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for product: ${product.name}` 
          });
        }
        
        const itemTotal = product.price * item.quantity;
        total_amount += itemTotal;
        
        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price
        });
      }
      
      // Create order
      const order = await Order.create({
        user_id: req.user.id,
        order_date: new Date(),
        total_amount
      });
      
      // Create order items and update stock
      for (const item of orderItems) {
        await OrderItem.create({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        });
        
        // Update product stock
        const product = await Product.findByPk(item.product_id);
        await product.update({ 
          stock: product.stock - item.quantity 
        });
      }
      
      // Fetch complete order with items
      const completeOrder = await Order.findByPk(order.id, {
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password'] } },
          { 
            model: OrderItem, 
            as: 'order_items',
            include: [{ model: Product, as: 'product' }]
          }
        ]
      });
      
      res.status(201).json(completeOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async getUserOrders(req, res) {
    try {
      const orders = await Order.findAll({
        where: { user_id: req.user.id },
        include: [
          { 
            model: OrderItem, 
            as: 'order_items',
            include: [{ model: Product, as: 'product' }]
          }
        ],
        order: [['order_date', 'DESC']]
      });
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async getAllOrders(req, res) {
    try {
      const orders = await Order.findAll({
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password'] } },
          { 
            model: OrderItem, 
            as: 'order_items',
            include: [{ model: Product, as: 'product' }]
          }
        ],
        order: [['order_date', 'DESC']]
      });
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async getOrderById(req, res) {
    try {
      const order = await Order.findByPk(req.params.id, {
        include: [
          { model: User, as: 'user', attributes: { exclude: ['password'] } },
          { 
            model: OrderItem, 
            as: 'order_items',
            include: [{ model: Product, as: 'product' }]
          }
        ]
      });
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Check if user owns the order or is admin
      if (order.user_id !== req.user.id && !req.user.is_admin) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await Order.findByPk(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      await order.update({ status });
      res.json({
        message: 'Order status updated successfully',
        order
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async deleteOrder(req, res) {
    try {
      const order = await Order.findByPk(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Restore stock when deleting order
      const orderItems = await OrderItem.findAll({
        where: { order_id: order.id }
      });
      
      for (const item of orderItems) {
        const product = await Product.findByPk(item.product_id);
        await product.update({ 
          stock: product.stock + item.quantity 
        });
      }
      
      await order.destroy();
      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = orderController;