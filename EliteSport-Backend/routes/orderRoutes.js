// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, orderController.createOrder);
router.get('/', authenticateToken, orderController.getUserOrders);
router.get('/all', authenticateToken, isAdmin, orderController.getAllOrders);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.put('/:id/status', authenticateToken, isAdmin, orderController.updateOrderStatus);
router.delete('/:id', authenticateToken, isAdmin, orderController.deleteOrder);

module.exports = router;