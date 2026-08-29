// routes/orderItemRoutes.js
const express = require('express');
const router = express.Router();
const orderItemController = require('../controllers/orderItemController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/order/:orderId', authenticateToken, orderItemController.getOrderItemsByOrder);
router.get('/:id', authenticateToken, orderItemController.getOrderItemById);
router.put('/:id', authenticateToken, isAdmin, orderItemController.updateOrderItem);
router.delete('/:id', authenticateToken, isAdmin, orderItemController.deleteOrderItem);

module.exports = router;