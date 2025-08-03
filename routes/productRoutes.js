const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middlewares/auth');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Added for directory creation

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/';
    // Ensure directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await db.promise.all('SELECT * FROM products');
    res.json(products);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await db.promise.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product
router.put('/:id',  async (req, res) => {
  const productId = req.params.id;
  const { name, description, category, price, old_price, stock_quantity } = req.body;

  try {
    const result = await db.promise.run(
      `UPDATE products SET 
       name = ?, description = ?, category = ?, price = ?, old_price = ?, stock_quantity = ? 
       WHERE id = ?`,
      [name, description, category, price, old_price, stock_quantity, productId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  const productId = req.params.id;
  try {
    const result = await db.promise.run('DELETE FROM products WHERE id = ?', [productId]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Create new product with image upload
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const old_price = req.body.old_price || null;
    const { name, description, category, price, stock_quantity } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate required fields
    if (!name || !price || !category) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Name, price and category are required' });
    }

    const result = await db.promise.run(
      `INSERT INTO products 
       (name, description, category, price, old_price, image_url, stock_quantity) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, category, price, old_price, image_url, stock_quantity || 0]
    );

    // Get the newly created product
    const product = await db.promise.get('SELECT * FROM products WHERE id = ?', [result.lastID]);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    // Clean up uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to create product' });
  }
});

module.exports = router;