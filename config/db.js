
// const { Sequelize } = require('sequelize');

// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage: './database.sqlite' 
// });

// module.exports = sequelize;


const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.NODE_ENV === 'production' 
    ? '/data/database.sqlite'  // Railway persistent storage path
    : path.join(__dirname, 'database.sqlite'),
  logging: console.log
});
module.exports = sequelize;