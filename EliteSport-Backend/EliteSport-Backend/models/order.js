'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Order belongs to User
      Order.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      
      // Order belongs to many Products through OrderItem
      Order.belongsToMany(models.Product, {
        through: models.OrderItem,
        foreignKey: 'order_id',
        otherKey: 'product_id',
        as: 'products'
      });
      
      // Order has many OrderItems
      Order.hasMany(models.OrderItem, {
        foreignKey: 'order_id',
        as: 'order_items'
      });
    }
  }
  Order.init({
    user_id: DataTypes.BIGINT,
    order_date: DataTypes.DATE,
    total_amount: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};