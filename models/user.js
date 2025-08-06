const bcrypt = require('bcryptjs');

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust path as needed

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING
  }
}, {
  timestamps: false,
  // hooks: {
  //   beforeCreate: async (user) => {
  //     if (user.password) {
  //       const salt = await bcrypt.genSalt(10);
  //       user.password = await bcrypt.hash(user.password, salt);
  //     }
  //   }
  // }

  
});

module.exports = User;