const db = require('../db');

const productController = {
    getAllProducts: async (req, res) => {
        try {
            // Optional pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Optional filtering
            const category = req.query.category;
            const minPrice = req.query.minPrice;
            const maxPrice = req.query.maxPrice;

            let query = 'SELECT * FROM products';
            const params = [];

            // Build WHERE clause for filters
            const conditions = [];
            if (category) {
                conditions.push('category = ?');
                params.push(category);
            }
            if (minPrice) {
                conditions.push('price >= ?');
                params.push(minPrice);
            }
            if (maxPrice) {
                conditions.push('price <= ?');
                params.push(maxPrice);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            // Add pagination
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const products = await db.promise.all(query, params);
            
            // Get total count for pagination metadata
            let countQuery = 'SELECT COUNT(*) as total FROM products';
            if (conditions.length > 0) {
                countQuery += ' WHERE ' + conditions.join(' AND ');
            }
            const { total } = await db.promise.get(countQuery, params.slice(0, -2)); // Exclude limit/offset
            
            res.json({
                success: true,
                data: products,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to fetch products',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    getProductById: async (req, res) => {
        try {
            const product = await db.promise.get(
                'SELECT * FROM products WHERE id = ?', 
                [req.params.id]
            );
            
            if (!product) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Product not found' 
                });
            }
            
            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to fetch product',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // createProduct: async (req, auth, res) => {
    //     try {
    //         const { name, description, category, price, old_price, stock_quantity, image_url } = req.body;
            
    //         // Validate required fields
    //         if (!name || !category || !price) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: 'Name, category, and price are required fields'
    //             });
    //         }

    //         // Validate price is positive
    //         if (price <= 0) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: 'Price must be a positive number'
    //             });
    //         }

    //         const result = await db.promise.run(
    //             `INSERT INTO products 
    //             (name, description, category, price, old_price, stock_quantity, image_url) 
    //             VALUES (?, ?, ?, ?, ?, ?, ?)`,
    //             [
    //                 name,
    //                 description || null,
    //                 category,
    //                 price,
    //                 old_price || null,
    //                 stock_quantity || 0,
    //                 image_url || null
    //             ]
    //         );
            
    //         // Fetch the newly created product to return
    //         const newProduct = await db.promise.get(
    //             'SELECT * FROM products WHERE id = ?',
    //             [result.lastID]
    //         );
            
    //         res.status(201).json({ 
    //             success: true,
    //             message: 'Product created successfully',
    //             data: newProduct
    //         });
    //     } catch (error) {
    //         console.error('Error creating product:', error);
            
    //         // Handle SQLite constraint errors
    //         if (error.message.includes('UNIQUE constraint failed')) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: 'Product with similar attributes already exists'
    //             });
    //         }
            
    //         res.status(500).json({ 
    //             success: false,
    //             message: 'Failed to create product',
    //             error: process.env.NODE_ENV === 'development' ? error.message : undefined
    //         });
    //     }
    // },

    createProduct: async (req, auth, res) => {
    try {
        // Check if user is authenticated
        if (!auth || !auth.user || !auth.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: You must be logged in to create a product.'
            });
        }

        const { name, description, category, price, old_price, stock_quantity, image_url } = req.body;

        // Validate required fields
        if (!name || !category || !price) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, and price are required fields'
            });
        }

        // Validate price is positive
        if (price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive number'
            });
        }

        // Insert product into database
        const result = await db.promise.run(
            `INSERT INTO products 
            (name, description, category, price, old_price, stock_quantity, image_url, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                category,
                price,
                old_price || null,
                stock_quantity || 0,
                image_url || null,
                auth.user.id // track the creator
            ]
        );

        // Fetch the newly created product
        const newProduct = await db.promise.get(
            'SELECT * FROM products WHERE id = ?',
            [result.lastID]
        );

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });

    } catch (error) {
        console.error('Error creating product:', error);

        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({
                success: false,
                message: 'Product with similar attributes already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
},


    updateProduct: async (req, res) => {
        try {
            const { name, description, category, price, old_price, stock_quantity, image_url } = req.body;
            
            // Validate price if provided
            if (price && price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a positive number'
                });
            }

            const result = await db.promise.run(
                `UPDATE products SET 
                name = COALESCE(?, name), 
                description = COALESCE(?, description), 
                category = COALESCE(?, category), 
                price = COALESCE(?, price), 
                old_price = COALESCE(?, old_price), 
                stock_quantity = COALESCE(?, stock_quantity), 
                image_url = COALESCE(?, image_url)
                WHERE id = ?`,
                [
                    name,
                    description,
                    category,
                    price,
                    old_price,
                    stock_quantity,
                    image_url,
                    req.params.id
                ]
            );
            
            if (result.changes === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Product not found' 
                });
            }
            
            // Fetch the updated product to return
            const updatedProduct = await db.promise.get(
                'SELECT * FROM products WHERE id = ?',
                [req.params.id]
            );
            
            res.json({ 
                success: true,
                message: 'Product updated successfully',
                data: updatedProduct
            });
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to update product',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            // First fetch the product to return data before deletion
            const product = await db.promise.get(
                'SELECT * FROM products WHERE id = ?',
                [req.params.id]
            );
            
            if (!product) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Product not found' 
                });
            }

            const result = await db.promise.run(
                'DELETE FROM products WHERE id = ?',
                [req.params.id]
            );
            
            res.json({ 
                success: true,
                message: 'Product deleted successfully',
                data: product
            });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to delete product',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Additional method for product search
    searchProducts: async (req, res) => {
        try {
            const searchTerm = req.query.q;
            if (!searchTerm) {
                return res.status(400).json({
                    success: false,
                    message: 'Search term is required'
                });
            }

            const products = await db.promise.all(
                `SELECT * FROM products 
                 WHERE name LIKE ? OR description LIKE ? OR category LIKE ?`,
                [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
            );

            res.json({
                success: true,
                data: products
            });
        } catch (error) {
            console.error('Error searching products:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to search products',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = productController;

