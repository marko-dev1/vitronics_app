// // Unified cart event handler
// async function handleCartAction(e) {
//     const cartItem = e.target.closest('.cart-item');
//     if (!cartItem) return;
    
//     const itemId = cartItem.getAttribute('data-id');
//     const productId = cartItem.getAttribute('data-product-id');
//     const item = cart.find(item => item.id === itemId);
//     if (!item) return;
    
//     try {
//         // Determine action type
//         let action = null;
//         let newQuantity = item.quantity;
        
//         if (e.target.classList.contains('decrease')) {
//             if (item.quantity > 1) {
//                 action = 'update';
//                 newQuantity = item.quantity - 1;
//             } else {
//                 action = 'remove';
//             }
//         } 
//         else if (e.target.classList.contains('increase')) {
//             action = 'update';
//             newQuantity = item.quantity + 1;
//         }
//         else if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
//             action = 'remove';
//         }
//         else if (e.target.classList.contains('quantity-input')) {
//             action = 'update';
//             newQuantity = Math.max(1, parseInt(e.target.value) || 1);
//         }
        
//         if (!action) return;
        
//         // Optimistic UI update
//         if (action === 'update') {
//             item.quantity = newQuantity;
//         } else {
//             cart = cart.filter(i => i.id !== itemId);
//         }
//         updateCartUI();
        
//         // Sync with server
//         const sessionId = localStorage.getItem('sessionId');
//         if (itemId.startsWith('temp_')) {
//             // If temporary ID, we need to find the real ID or add new
//             await syncTempCartItem(itemId, productId, newQuantity, action);
//         } else {
//             // Existing item - direct API call
//             if (action === 'update') {
//                 await fetch(`/api/cart/items/${itemId}`, {
//                     method: 'PUT',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'X-Session-ID': sessionId
//                     },
//                     body: JSON.stringify({ quantity: newQuantity })
//                 });
//             } else {
//                 await fetch(`/api/cart/items/${itemId}`, {
//                     method: 'DELETE',
//                     headers: {
//                         'X-Session-ID': sessionId
//                     }
//                 });
//             }
//         }
        
//         // Refresh cart from server
//         await initCart();
        
//     } catch (error) {
//         console.error('Cart action failed:', error);
//         showError('Cart update failed - will retry');
//         // Revert to last server state
//         await initCart();
//     }
// }

// // Helper to sync temporary cart items
// async function syncTempCartItem(tempId, productId, quantity, action) {
//     const sessionId = localStorage.getItem('sessionId');
    
//     if (action === 'remove') {
//         // Just remove from local cart
//         return;
//     }
    
//     // Check if item exists on server
//     const cartResponse = await fetch('/api/cart', {
//         headers: {
//             'X-Session-ID': sessionId
//         }
//     });
    
//     if (cartResponse.ok) {
//         const data = await cartResponse.json();
//         const serverItem = data.items.find(item => item.product_id == productId);
        
//         if (serverItem) {
//             // Update existing server item
//             await fetch(`/api/cart/items/${serverItem.id}`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'X-Session-ID': sessionId
//                 },
//                 body: JSON.stringify({ quantity })
//             });
//         } else {
//             // Add new item to server
//             await fetch('/api/cart/items', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'X-Session-ID': sessionId
//                 },
//                 body: JSON.stringify({ productId, quantity })
//             });
//         }
//     }
// }

// // Initialize everything
// document.addEventListener('DOMContentLoaded', async () => {
//     // Initialize product store (from localStorage)
//     await initStore();
    
//     // Initialize cart (from database)
//     await initCart();
    
//     // Setup event listeners
//     document.addEventListener('click', function(e) {
//         // Add to cart buttons
//         if (e.target.classList.contains('add-to-cart')) {
//             const productId = e.target.getAttribute('data-id') || 
//                              e.target.closest('[data-id]').getAttribute('data-id');
//             addToCart(parseInt(productId));
//         }
        
//         // Cart actions
//         handleCartAction(e);
//     });
    
//     // Handle quantity input changes
//     cartItems.addEventListener('change', handleCartAction);
    
//     // Other existing event listeners...
// });


