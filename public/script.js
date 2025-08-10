let products = [];
let deals = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const productRow = document.getElementById('productRow');
const dealsRow = document.getElementById('dealsRow');
const cartModal = document.getElementById('cartModal');
const cartIcon = document.getElementById('cartIcon');
const closeModal = document.getElementById('closeModal');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const checkoutBtn = document.getElementById('checkoutBtn');
const paymentOptions = document.getElementById('paymentOptions');

// Payment Elements
const mpesaOption = document.getElementById('mpesaOption');
const mpesaDetails = document.getElementById('mpesaDetails');
const codOption = document.getElementById('codOption');
const codDetails = document.getElementById('codDetails');
const cardOption = document.getElementById('cardOption');
const cardDetails = document.getElementById('cardDetails');
const confirmMpesa = document.getElementById('confirmMpesa');
const confirmCOD = document.getElementById('confirmCOD');
const confirmCard = document.getElementById('confirmCard');
const mpesaFeedback = document.getElementById('mpesaFeedback');
const cardFeedback = document.getElementById('cardFeedback');

// Initialize the store
async function initStore() {
    showLoading(productRow);
    showLoading(dealsRow);
    
    try {
        await fetchProducts();
        setupEventListeners();
        updateCart();
    } catch (error) {
        console.error('Store initialization failed:', error);
        showError(productRow, 'Failed to load products');
        showError(dealsRow, 'Failed to load deals');
    }
}

// Show loading spinner
function showLoading(element) {
    element.innerHTML = '<div class="loading-spinner"></div>';
}

// Show error message
function showError(element, message) {
    element.innerHTML = `
        <div class="error-message">
            ${message}
            <button onclick="location.reload()">Retry</button>
        </div>
    `;
}

// Fetch products from database
async function fetchProducts() {
    try {
        const response = await fetch('/api/products?t=' + Date.now()); // Cache busting
        if (!response.ok) throw new Error('Network response was not ok');
        
        products = await response.json();
        
        // Create deals (first 4 products with 20% discount)
        deals = products.slice(0, 5).map(product => ({
            ...product,
            price: Math.round(product.price * 0.8), // 20% off
            oldPrice: product.price
        }));
        
        renderProducts();
        renderDeals();
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

// Render products with event delegation
function renderProducts() {
    if (products.length === 0) {
        productRow.innerHTML = '<p class="no-products">No products available</p>';
        return;
    }
    
    productRow.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <img src="${product.image_url || product.image || '/img/placeholder.jpg'}" 
                 alt="${product.name}" 
                 class="product-img"
                 loading="lazy"
                 onerror="this.src='/img/placeholder.jpg'">
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3>${product.name}</h3>
                <div class="price">
                    Ksh ${product.price.toLocaleString()} 
                    ${product.old_price || product.oldPrice ? 
                      `<span class="old-price">Ksh ${(product.old_price || product.oldPrice).toLocaleString()}</span>` : ''}
                </div>
                <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Render deals
function renderDeals() {
    if (deals.length === 0) {
        dealsRow.innerHTML = '<p class="no-products">No deals available</p>';
        return;
    }
    
    dealsRow.innerHTML = deals.map(product => `
        <div class="product-card" data-id="${product.id}">
            <span class="product-badge">HOT DEAL</span>
            <img src="${product.image_url || product.image || '/img/placeholder.jpg'}" 
                 alt="${product.name}" 
                 class="product-img"
                 loading="lazy"
                 onerror="this.src='/img/placeholder.jpg'">
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3>${product.name}</h3>
                <div class="price">
                    Ksh ${product.price.toLocaleString()} 
                    <span class="old-price">Ksh ${product.oldPrice.toLocaleString()}</span>
                </div>
                <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Event delegation setup
function setupEventListeners() {
    // Add to cart using event delegation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = parseInt(e.target.getAttribute('data-id'));
            addToCart(productId);
        }
    });
    
    // Cart icon click
    cartIcon.addEventListener('click', function(e) {
        e.preventDefault();
        cartModal.style.display = 'block';
    });
    
    // Close modal
    closeModal.addEventListener('click', function() {
        cartModal.style.display = 'none';
        resetPaymentOptions();
    });
    
    // Checkout button
    checkoutBtn.addEventListener('click', function() {
        if (cart.length > 0) {
            paymentOptions.style.display = 'block';
            checkoutBtn.style.display = 'none';
        }
    });

    // Payment method selection
    mpesaOption.addEventListener('click', function() {
        resetPaymentSelections();
        this.classList.add('selected');
        mpesaDetails.style.display = 'block';
    });
    
    codOption.addEventListener('click', function() {
        resetPaymentSelections();
        this.classList.add('selected');
        codDetails.style.display = 'block';
    });
    
    cardOption.addEventListener('click', function() {
        resetPaymentSelections();
        this.classList.add('selected');
        cardDetails.style.display = 'block';
    });
    
    // Payment confirmation buttons
    confirmMpesa.addEventListener('click', processMpesaPayment);
    confirmCOD.addEventListener('click', processCODPayment);
    confirmCard.addEventListener('click', processCardPayment);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
            resetPaymentOptions();
        }
    });
    
    // Cart event delegation
    cartItems.addEventListener('click', handleCartClick);
    cartItems.addEventListener('change', handleCartChange);
}

// Handle cart interactions
function handleCartClick(e) {
    const cartItem = e.target.closest('.cart-item');
    if (!cartItem) return;
    
    const productId = parseInt(cartItem.getAttribute('data-id'));
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    if (e.target.classList.contains('decrease')) {
        if (item.quantity > 1) {
            item.quantity -= 1;
            updateCart();
        }
    } 
    else if (e.target.classList.contains('increase')) {
        item.quantity += 1;
        updateCart();
    }
    else if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
        cart = cart.filter(item => item.id !== productId);
        updateCart();
    }
}

function handleCartChange(e) {
    if (e.target.classList.contains('quantity-input')) {
        const cartItem = e.target.closest('.cart-item');
        const productId = parseInt(cartItem.getAttribute('data-id'));
        const item = cart.find(item => item.id === productId);
        const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
        
        item.quantity = newQuantity;
        updateCart();
    }
}

// Reset payment options
function resetPaymentOptions() {
    paymentOptions.style.display = 'none';
    checkoutBtn.style.display = 'block';
    resetPaymentSelections();
}

// Reset payment selections
function resetPaymentSelections() {
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    document.querySelectorAll('.payment-details').forEach(d => d.style.display = 'none');
    document.querySelectorAll('.payment-feedback').forEach(f => {
        f.style.display = 'none';
        f.innerHTML = '';
    });
}

function addToCart(productId) {
    // First check deals (discounted products), then regular products
    const product = [...deals, ...products].find(p => p.id == productId);
    
    if (product) {
        const existingItem = cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price, // This will use the discounted price for deals
                image: product.image_url || product.image || '/img/placeholder.jpg',
                quantity: 1
            });
        }
        
        updateCart();
        showToast(`${product.name} added to cart`);
    } else {
        console.error(`Product with ID ${productId} not found`);
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function updateCart() {
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    cartCount.textContent = totalItems;
    
    if (cart.length > 0) {
        emptyCartMessage.style.display = 'none';
        cartItems.innerHTML = cart.map(item => {
            const price = item.price || 0;
            return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image || '/img/placeholder.jpg'}" 
                     alt="${item.name || 'Product'}" 
                     class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name || 'Unknown Product'}</div>
                    <div class="cart-item-price">Ksh ${price.toLocaleString()}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="quantity-input">
                        <button class="quantity-btn increase">+</button>
                        <button class="remove-item"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } else {
        emptyCartMessage.style.display = 'block';
        cartItems.innerHTML = '';
        resetPaymentOptions();
    }
    
    const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    cartTotal.textContent = `Ksh ${total.toLocaleString()}`;
}

// Process M-Pesa Payment
function processMpesaPayment() {
    const phone = document.getElementById('mpesaPhone').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (!phone || phone.length < 10) {
        mpesaFeedback.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please enter a valid M-Pesa phone number (e.g. 0712345678)';
        mpesaFeedback.className = 'payment-feedback payment-error';
        mpesaFeedback.style.display = 'block';
        return;
    }
    
    mpesaFeedback.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initiating M-Pesa payment request...';
    mpesaFeedback.className = 'payment-feedback';
    mpesaFeedback.style.display = 'block';
    
    // Simulate M-Pesa STK Push (replace with actual API call)
    setTimeout(() => {
        // Simulate 80% success rate
        if (Math.random() > 0.2) {
            mpesaFeedback.innerHTML = `
                <i class="fas fa-check-circle"></i> M-Pesa payment request sent to ${phone}!
                <p>Check your phone to complete payment of Ksh ${total.toLocaleString()}</p>
            `;
            mpesaFeedback.className = 'payment-feedback payment-success';
            
            // Simulate successful payment after 3 seconds
            setTimeout(() => {
                completeOrder('M-Pesa', phone);
            }, 3000);
        } else {
            mpesaFeedback.innerHTML = '<i class="fas fa-times-circle"></i> Failed to initiate payment. Please try again.';
            mpesaFeedback.className = 'payment-feedback payment-error';
        }
    }, 2000);
}

// Process Cash on Delivery
function processCODPayment() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (confirm(`Confirm Cash on Delivery order for Ksh ${total.toLocaleString()}? A delivery fee of Ksh 100 will be added.`)) {
        const deliveryAddress = prompt("Please enter your delivery address:");
        if (deliveryAddress) {
            completeOrder('Cash on Delivery', null, deliveryAddress);
        }
    }
}

// Process Card Payment
function processCardPayment() {
    const cardNumber = document.getElementById('cardNumber').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvv = document.getElementById('cardCvv').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (!cardNumber || !cardExpiry || !cardCvv) {
        cardFeedback.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please fill in all card details';
        cardFeedback.className = 'payment-feedback payment-error';
        cardFeedback.style.display = 'block';
        return;
    }
    
    cardFeedback.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing card payment...';
    cardFeedback.className = 'payment-feedback';
    cardFeedback.style.display = 'block';
    
    // Simulate card payment processing (replace with actual API call)
    setTimeout(() => {
        // Simulate 80% success rate
        if (Math.random() > 0.2) {
            cardFeedback.innerHTML = `
                <i class="fas fa-check-circle"></i> Payment of Ksh ${total.toLocaleString()} successful!
                <p>Your card ending with ${cardNumber.slice(-4)} has been charged.</p>
            `;
            cardFeedback.className = 'payment-feedback payment-success';
            
            // Complete order after showing success message
            setTimeout(() => {
                completeOrder('Card Payment');
            }, 2000);
        } else {
            cardFeedback.innerHTML = '<i class="fas fa-times-circle"></i> Payment failed. Please check your card details and try again.';
            cardFeedback.className = 'payment-feedback payment-error';
        }
    }, 2000);
}

// Complete order after successful payment
function completeOrder(paymentMethod, phone = null, deliveryAddress = "N/A") {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = paymentMethod === 'Cash on Delivery' ? 100 : 0;
    const finalTotal = total + deliveryFee;
    
    // Prepare order data
    const order = {
        id: "ORD" + Date.now().toString().slice(-6),
        date: new Date().toLocaleString(),
        paymentMethod: paymentMethod,
        subtotal: total,
        deliveryFee: deliveryFee,
        finalTotal: finalTotal,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        user: {
            phone: phone || 'N/A',
            deliveryAddress: deliveryAddress
        }
    };
    
    // Show confirmation
    showOrderConfirmation(order);
    
    // Generate receipt
    generateReceipt(order);
    
    // Reset cart and UI
    resetCheckoutUI();
}

// Show order confirmation alert
function showOrderConfirmation(orderData) {
    alert(`Order confirmed!\n\nOrder ID: ${orderData.id}\nSubtotal: Ksh ${orderData.subtotal.toLocaleString()}\n${
      orderData.deliveryFee > 0 ? 'Delivery Fee: Ksh 100\n' : ''
    }Total: Ksh ${orderData.finalTotal.toLocaleString()}\nPayment Method: ${
      orderData.paymentMethod
    }\n\nThank you for shopping with us!`);
}

// Generate receipt
function generateReceipt(order) {
    const receiptWindow = window.open('', '_blank', 'width=800,height=900');
    
    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Sales Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            padding: 20px;
            color: #333;
            margin: 0;
          }
          .container {
            background: #fff;
            padding: 20px;
            max-width: 700px;
            margin: auto;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            border-radius: 4px;
          }
          .top-header,.details{
            border-bottom: 1px solid gray;
          }
          hr {
            border: none;
            border-top: 2px dotted #333;
            margin: 20px 0;
          }
          h1, h2, h3, h4, h5 {
            margin: 5px 0;
            text-align: center;
          }
          .details {
            margin-top: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 14px;
          }
          .fee-row {
            font-weight: bold;
          }
          .total-row {
            font-weight: bold;
            font-size: 1.1em;
            background-color: #f5f5f5;
          }
          h4 {
            text-align: center;
            color: #d9534f;
            margin: 20px 0;
          }
          @media print {
            body {
              background: #fff;
              color: #000;
            }
            .container {
              box-shadow: none;
              margin: 0;
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <div class="top-header">
              <h1>VITRONICS</h1>
              <h5>VITRONICS SYSTEMS</h5>
              <h5>NAIROBI</h5>
              <h2>Official Sales Receipt</h2>
            </div>
          </header>

          <section class="info">
            <div class="details">
              <p>Date: ${order.date}</p>
              <p>Order #: ${order.id}</p>
              <hr>
              <div class="product-info">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map(item => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>Ksh ${item.price.toLocaleString()}</td>
                        <td>Ksh ${(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    `).join('')}
                    ${order.deliveryFee > 0 ? `
                      <tr class="fee-row">
                        <td colspan="3">Cash on Delivery Fee</td>
                        <td>Ksh ${order.deliveryFee.toLocaleString()}</td>
                      </tr>
                    ` : ''}
                    <tr class="total-row">
                      <td colspan="3">GRAND TOTAL</td>
                      <td>Ksh ${order.finalTotal.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>Payment Method: ${order.paymentMethod}</p>
              <p>Customer: ${order.user.phone}</p>
              <p>Delivery Address: ${order.user.deliveryAddress}</p>
            </div>
          </section>

          <p>Thank You for your business</p>
          <h4>GOODS ONCE SOLD ARE NOT ACCEPTED</h4>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    receiptWindow.document.close();
}

// Reset checkout UI
function resetCheckoutUI() {
    cart = [];
    updateCart();
    if (cartModal) cartModal.style.display = 'none';
    resetPaymentOptions();
}

// Initialize the store when DOM is loaded
document.addEventListener('DOMContentLoaded', initStore);