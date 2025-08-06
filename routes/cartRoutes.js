// const express = require('express');
// const router = express.Router();
// const db = require('../config/db');

// // Helper function to get or create cart
// async function getOrCreateCart(sessionId, userId = null) {
//     let cart;
    
//     if (userId) {
//         // For logged-in users
//         [cart] = await db.query(
//             'SELECT * FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
//             [userId]
//         );
//     } else {
//         // For guests
//         [cart] = await db.query(
//             'SELECT * FROM carts WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
//             [sessionId]
//         );
//     }
    
//     if (!cart) {
//         // Create new cart
//         const [result] = await db.query(
//             'INSERT INTO carts (user_id, session_id) VALUES (?, ?)',
//             [userId, userId ? null : sessionId]
//         );
//         [cart] = await db.query('SELECT * FROM carts WHERE id = ?', [result.insertId]);
//     }
    
//     return cart;
// }

// // Get cart contents
// router.get('/', async (req, res) => {
//     try {
//         const { sessionId, userId } = req; // You'll need to pass these from middleware
        
//         const cart = await getOrCreateCart(sessionId, userId);
        
//         const [items] = await db.query(`
//             SELECT ci.*, p.name, p.price, p.image_url 
//             FROM cart_items ci
//             JOIN products p ON ci.product_id = p.id
//             WHERE ci.cart_id = ?
//         `, [cart.id]);
        
//         res.json({
//             cartId: cart.id,
//             items
//         });
//     } catch (err) {
//         console.error('Error fetching cart:', err);
//         res.status(500).json({ error: 'Failed to fetch cart' });
//     }
// });

// // Add item to cart
// router.post('/items', async (req, res) => {
//     try {
//         const { sessionId, userId } = req;
//         const { productId, quantity = 1 } = req.body;
        
//         const cart = await getOrCreateCart(sessionId, userId);
        
//         // Check if product exists
//         const [product] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
//         if (!product) {
//             return res.status(404).json({ error: 'Product not found' });
//         }
        
//         // Check if item already in cart
//         const [existingItem] = await db.query(
//             'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
//             [cart.id, productId]
//         );
        
//         if (existingItem) {
//             // Update quantity
//             await db.query(
//                 'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
//                 [quantity, existingItem.id]
//             );
//         } else {
//             // Add new item
//             await db.query(
//                 'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
//                 [cart.id, productId, quantity]
//             );
//         }
        
//         res.json({ success: true });
//     } catch (err) {
//         console.error('Error adding to cart:', err);
//         res.status(500).json({ error: 'Failed to add to cart' });
//     }
// });

// // Update cart item quantity
// router.put('/items/:itemId', async (req, res) => {
//     try {
//         const { itemId } = req.params;
//         const { quantity } = req.body;
        
//         if (quantity < 1) {
//             return res.status(400).json({ error: 'Quantity must be at least 1' });
//         }
        
//         await db.query(
//             'UPDATE cart_items SET quantity = ? WHERE id = ?',
//             [quantity, itemId]
//         );
        
//         res.json({ success: true });
//     } catch (err) {
//         console.error('Error updating cart item:', err);
//         res.status(500).json({ error: 'Failed to update cart item' });
//     }
// });

// // Remove item from cart
// router.delete('/items/:itemId', async (req, res) => {
//     try {
//         const { itemId } = req.params;
        
//         await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
        
//         res.json({ success: true });
//     } catch (err) {
//         console.error('Error removing cart item:', err);
//         res.status(500).json({ error: 'Failed to remove cart item' });
//     }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper function to get or create cart
async function getOrCreateCart(sessionId, userId = null) {
    let cart;
    
    if (userId) {
        // For logged-in users
        [cart] = await db.query(
            'SELECT * FROM carts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
    } else {
        // For guests
        [cart] = await db.query(
            'SELECT * FROM carts WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
            [sessionId]
        );
    }
    
    if (!cart) {
        // Create new cart
        const [result] = await db.query(
            'INSERT INTO carts (user_id, session_id) VALUES (?, ?)',
            [userId, userId ? null : sessionId]
        );
        [cart] = await db.query('SELECT * FROM carts WHERE id = ?', [result.insertId]);
    }
    
    return cart;
}

// Get cart contents
router.get('/', async (req, res) => {
    try {
        const { sessionId, userId } = req; // You'll need to pass these from middleware
        
        const cart = await getOrCreateCart(sessionId, userId);
        
        const [items] = await db.query(`
            SELECT ci.*, p.name, p.price, p.image_url 
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
        `, [cart.id]);
        
        res.json({
            cartId: cart.id,
            items
        });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add item to cart
router.post('/items', async (req, res) => {
    try {
        const { sessionId, userId } = req;
        const { productId, quantity = 1 } = req.body;
        
        const cart = await getOrCreateCart(sessionId, userId);
        
        // Check if product exists
        const [product] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Check if item already in cart
        const [existingItem] = await db.query(
            'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
            [cart.id, productId]
        );
        
        if (existingItem) {
            // Update quantity
            await db.query(
                'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                [quantity, existingItem.id]
            );
        } else {
            // Add new item
            await db.query(
                'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
                [cart.id, productId, quantity]
            );
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Update cart item quantity
router.put('/items/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        
        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }
        
        await db.query(
            'UPDATE cart_items SET quantity = ? WHERE id = ?',
            [quantity, itemId]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating cart item:', err);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

// Remove item from cart
router.delete('/items/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        
        await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing cart item:', err);
        res.status(500).json({ error: 'Failed to remove cart item' });
    }
});

module.exports = router;