// controllers/orderItemController.js
const { OrderItem, Order, Product } = require('../models');

const orderItemController = {
  async getOrderItemsByOrder(req, res) {
    try {
      const { orderId } = req.params;
      
      const orderItems = await OrderItem.findAll({
        where: { order_id: orderId },
        include: [
          { model: Order, as: 'order' },
          { model: Product, as: 'product' }
        ]
      });
      
      res.json(orderItems);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async getOrderItemById(req, res) {
    try {
      const orderItem = await OrderItem.findByPk(req.params.id, {
        include: [
          { model: Order, as: 'order' },
          { model: Product, as: 'product' }
        ]
      });
      
      if (!orderItem) {
        return res.status(404).json({ error: 'Order item not found' });
      }
      
      res.json(orderItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async updateOrderItem(req, res) {
    try {
      const { quantity } = req.body;
      const orderItem = await OrderItem.findByPk(req.params.id);
      
      if (!orderItem) {
        return res.status(404).json({ error: 'Order item not found' });
      }
      
      // Adjust product stock based on quantity change
      const product = await Product.findByPk(orderItem.product_id);
      const quantityDiff = quantity - orderItem.quantity;
      
      if (quantityDiff > 0 && product.stock < quantityDiff) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      
      await product.update({ stock: product.stock - quantityDiff });
      await orderItem.update({ quantity });
      
      // Update order total amount
      const order = await Order.findByPk(orderItem.order_id);
      const allItems = await OrderItem.findAll({
        where: { order_id: order.id }
      });
      
      const newTotal = allItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      
      await order.update({ total_amount: newTotal });
      
      res.json({
        message: 'Order item updated successfully',
        orderItem
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  async deleteOrderItem(req, res) {
    try {
      const orderItem = await OrderItem.findByPk(req.params.id);
      
      if (!orderItem) {
        return res.status(404).json({ error: 'Order item not found' });
      }
      
      // Restore stock
      const product = await Product.findByPk(orderItem.product_id);
      await product.update({ stock: product.stock + orderItem.quantity });
      
      // Update order total
      const order = await Order.findByPk(orderItem.order_id);
      await order.update({ 
        total_amount: order.total_amount - (orderItem.price * orderItem.quantity)
      });
      
      await orderItem.destroy();
      res.json({ message: 'Order item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = orderItemController;