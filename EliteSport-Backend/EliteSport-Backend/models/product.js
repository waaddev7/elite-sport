'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Product belongs to Category
      Product.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category'
      });
      
      // Product belongs to many Orders through OrderItem
      Product.belongsToMany(models.Order, {
        through: models.OrderItem,
        foreignKey: 'product_id',
        otherKey: 'order_id',
        as: 'orders'
      });
      
      // Product has many OrderItems
      Product.hasMany(models.OrderItem, {
        foreignKey: 'product_id',
        as: 'order_items'
      });
    }
  }
  Product.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.DECIMAL,
    stock: DataTypes.INTEGER,
    category_id: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};