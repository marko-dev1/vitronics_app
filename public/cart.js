// async function loadCartFromDatabase() {
//   try {
//     const userId = getCurrentUserId();
    
//     if (userId) {
//       const response = await fetch(`/api/cart/${userId}`, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
      
//       if (response.ok) {
//         const dbCart = await response.json();
//         cart = Array.isArray(dbCart) ? dbCart : [];
//       }
//     }
    
//     // Fallback to localStorage if no user or API fails
//     if (cart.length === 0) {
//       const localCart = JSON.parse(localStorage.getItem('cart')) || [];
//       cart = localCart;
//     }
    
//     updateCart();
//   } catch (error) {
//     console.error('Error loading cart:', error);
//     const localCart = JSON.parse(localStorage.getItem('cart')) || [];
//     cart = localCart;
//     updateCart();
//   }
// }

// // Call this when your app initializes
// document.addEventListener('DOMContentLoaded', () => {
//   loadCartFromDatabase();
//   // ... other initialization code
// });