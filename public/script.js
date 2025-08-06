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
    const product = [...products, ...deals].find(p => p.id == productId);
    
    if (product) {
        const existingItem = cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                oldPrice: product.old_price || product.oldPrice,
                image: product.image_url || product.image,
                quantity: 1
            });
        }

        updateCart();
        showToast(`${product.name} added to cart`);
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


// Show cart notification
function showCartNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// Update cart and persist to localStorage
function updateCart() {
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length > 0) {
        emptyCartMessage.style.display = 'none';
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">Ksh ${item.price.toLocaleString()}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="quantity-input">
                        <button class="quantity-btn increase">+</button>
                        <button class="remove-item"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        emptyCartMessage.style.display = 'block';
        cartItems.innerHTML = '';
        resetPaymentOptions();
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `Ksh ${total.toLocaleString()}`;
}
        // Process M-Pesa Payment
        function processMpesaPayment() {
            const phone = document.getElementById('mpesaPhone').value;
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            if (!phone || phone.length < 12) {
                mpesaFeedback.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please enter a valid M-Pesa phone number (e.g. 254712345678)';
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
                        completeOrder('M-Pesa');
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
            
            if (confirm(`Confirm Cash on Delivery order for Ksh ${total.toLocaleString()}?`)) {
                completeOrder('Cash on Delivery');
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
        function completeOrder(paymentMethod) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // In a real implementation, you would send the order to your backend
            console.log(`Order completed via ${paymentMethod} for Ksh ${total}`);
            
            // Show confirmation
            alert(`Order confirmed!\n\nTotal: Ksh ${total.toLocaleString()}\nPayment Method: ${paymentMethod}\n\nThank you for shopping with us!`);
            
            // Reset cart and close modal
            cart = [];
            updateCart();
            cartModal.style.display = 'none';
            resetPaymentOptions();
        }
        
        // Initialize the store when DOM is loaded
       document.addEventListener('DOMContentLoaded', initStore);




