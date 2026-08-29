// controllers/userController.js
const { User, Order } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const userController = {
  // Register new user
  async register(req, res) {
    try {
      const { username, email, password, is_admin = false } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        is_admin
      });
      
      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, is_admin: user.is_admin },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      res.json({
        message: 'Login successful',
        token,
        user: userResponse
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Order,
          as: 'orders'
        }]
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Update user profile
  async updateProfile(req, res) {
    try {
      const { username, email, password } = req.body;
      const updateData = { username, email };
      
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      
      await User.update(updateData, { where: { id: req.user.id } });
      
      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      
      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Admin: Get all users
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        include: [{
          model: Order,
          as: 'orders'
        }]
      });
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Admin: Get user by ID
  async getUserById(req, res) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Order,
          as: 'orders'
        }]
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Admin: Delete user
  async deleteUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = userController;