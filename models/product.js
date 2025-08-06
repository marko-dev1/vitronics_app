

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Product extends Model {
  static async ensureSchema() {
    // Check and sync any changes in schema
    await Product.sync(); // Uses model definition to sync table
  }

  static async findAllProducts() {
    await this.ensureSchema();
    return await Product.findAll();
  }

  static async findByProductId(id) {
    await this.ensureSchema();
    return await Product.findByPk(id);
  }

  static async createProduct(productData) {
    await this.ensureSchema();
    return await Product.create({
      name: productData.name,
      description: productData.description || null,
      category: productData.category || 'uncategorized',
      price: productData.price,
      old_price: productData.old_price || null,
      image_url: productData.image_url || null,
      stock_quantity: productData.stock_quantity || 0
    });
  }

  static async updateProduct(id, productData) {
    await this.ensureSchema();
    await Product.update(
      {
        name: productData.name,
        description: productData.description || null,
        category: productData.category || 'uncategorized',
        price: productData.price,
        old_price: productData.old_price || null,
        image_url: productData.image_url || null,
        stock_quantity: productData.stock_quantity || 0,
        updated_at: new Date()
      },
      { where: { id } }
    );
    return await Product.findByPk(id);
  }

  static async deleteProduct(id) {
    await this.ensureSchema();
    await Product.destroy({ where: { id } });
    return { deleted: true, id };
  }

  static async findByCategory(category) {
    await this.ensureSchema();
    return await Product.findAll({ where: { category } });
  }

  static async updateStock(id, quantityChange) {
    await this.ensureSchema();
    const product = await Product.findByPk(id);
    if (product) {
      product.stock_quantity += quantityChange;
      await product.save();
      return product;
    }
    return null;
  }
}

// Define schema
Product.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    category: { type: DataTypes.STRING, defaultValue: 'uncategorized' },
    price: { type: DataTypes.FLOAT, allowNull: false },
    old_price: DataTypes.FLOAT,
    image_url: DataTypes.STRING,
    stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    updated_at: { type: DataTypes.DATE }
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: false
  }
);

// Initialize
Product.ensureSchema().catch((err) => {
  console.error('Failed to initialize product schema:', err);
});

module.exports = Product;
