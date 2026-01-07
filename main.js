// Silvar.gg Main JavaScript - Fixed Functionality
class SilvarApp {
    constructor() {
        this.currentUser = null;
        this.cart = JSON.parse(localStorage.getItem('silvar_cart') || '[]');
        this.balance = parseInt(localStorage.getItem('silvar_balance') || '0');
        this.init();
    }

    init() {
        this.initTheme();
        this.initAuth();
        this.initCart();
        this.initWheelPicker();
        this.bindEvents();
        this.updateUI();
    }

    initTheme() {
        const toggle = document.getElementById('theme-toggle');
        const html = document.documentElement;
        const saved = localStorage.getItem('theme');
        if (saved) html.classList.toggle('dark', saved === 'dark');
        if (toggle) {
            toggle.addEventListener('click', () => {
                html.classList.toggle('dark');
                localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
            });
        }
    }

    initAuth() {
        const userStr = localStorage.getItem('silvar_user');
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
        }
    }

    initCart() {
        this.updateCartDisplay();
    }

    initWheelPicker() {
        // Wheel picker system with tiered selection
        this.wheelItems = {
            cheap: [
                { name: 'Common Knife', price: 0.50, image: '🔪' },
                { name: 'Basic Gun', price: 0.75, image: '🔫' },
                { name: 'Simple Pet', price: 0.60, image: '🐱' },
                { name: 'Common Skin', price: 0.40, image: '🎨' },
                { name: 'Basic Accessory', price: 0.55, image: '⭐' },
                { name: 'Simple Effect', price: 0.45, image: '✨' },
                { name: 'Common Crate', price: 0.30, image: '📦' },
                { name: 'Basic Key', price: 0.35, image: '🗝️' }
            ],
            normal: [
                { name: 'Godly Knife', price: 3.50, image: '⚔️' },
                { name: 'Rare Gun Set', price: 4.00, image: '🎯' },
                { name: 'Legendary Pet', price: 3.25, image: '🐉' },
                { name: 'Epic Skin Pack', price: 3.75, image: '🌈' },
                { name: 'Rare Accessory Set', price: 3.50, image: '💎' },
                { name: 'Special Effect Pack', price: 4.25, image: '🎆' },
                { name: 'Mystery Box', price: 3.00, image: '🎁' },
                { name: 'Exclusive Key', price: 3.80, image: '🌟' }
            ]
        };
    }

    bindEvents() {
        // Auth events
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="login"]')) this.showLoginModal();
            if (e.target.matches('[data-action="register"]')) this.showRegisterModal();
            if (e.target.matches('[data-action="logout"]')) this.logout();
            if (e.target.matches('[data-action="profile"]')) window.location.href = 'profile.html';
            if (e.target.matches('[data-action="admin"]')) window.location.href = 'admin.html';
            
            // Cart events
            if (e.target.matches('[data-action="add-to-cart"]')) this.addToCart(e.target);
            if (e.target.matches('[data-action="view-cart"]')) this.showCartPanel();
            if (e.target.matches('[data-action="close-cart"]')) this.closeCartPanel();
            if (e.target.matches('[data-action="checkout"]')) this.checkout();
            
            // Balance events
            if (e.target.matches('[data-action="add-balance"]')) this.showBalanceModal();
            
            // Blind box events
            if (e.target.matches('[data-action="open-blindbox"]')) this.openBlindBox(e.target);
            if (e.target.matches('[data-action="spin-wheel"]')) this.spinWheel();
        });

        // Cart overlay click
        const cartOverlay = document.getElementById('cart-overlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => {
                this.closeCartPanel();
            });
        }
    }

    // Authentication
    showLoginModal() {
        const modal = this.createModal('login-modal', `
            <div class="auth-modal">
                <h2>Login to Silvar.gg</h2>
                <form id="login-form">
                    <input type="email" placeholder="Email" required>
                    <input type="password" placeholder="Password" required>
                    <button type="submit" class="btn">Login</button>
                </form>
                <p>Don't have an account? <a href="#" data-action="register">Register</a></p>
            </div>
        `);
        
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target[0].value;
            const password = e.target[1].value;
            this.login(email, password);
            modal.remove();
        });
    }

    showRegisterModal() {
        const modal = this.createModal('register-modal', `
            <div class="auth-modal">
                <h2>Create Account</h2>
                <form id="register-form">
                    <input type="text" placeholder="Username" required>
                    <input type="email" placeholder="Email" required>
                    <input type="password" placeholder="Password" required>
                    <input type="password" placeholder="Confirm Password" required>
                    <button type="submit" class="btn">Register</button>
                </form>
                <p>Already have an account? <a href="#" data-action="login">Login</a></p>
            </div>
        `);
        
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = e.target[0].value;
            const email = e.target[1].value;
            const password = e.target[2].value;
            const confirm = e.target[3].value;
            
            if (password !== confirm) {
                alert('Passwords do not match!');
                return;
            }
            
            this.register(username, email, password);
            modal.remove();
        });
    }

    login(email, password) {
        const users = JSON.parse(localStorage.getItem('silvar_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = { ...user, password: undefined };
            localStorage.setItem('silvar_user', JSON.stringify(this.currentUser));
            this.updateUI();
            alert('Login successful!');
        } else {
            alert('Invalid credentials!');
        }
    }

    register(username, email, password) {
        const users = JSON.parse(localStorage.getItem('silvar_users') || '[]');
        
        if (users.find(u => u.email === email)) {
            alert('Email already registered!');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            balance: 0,
            joinDate: new Date().toISOString(),
            isAdmin: email === 'admin@silvar.gg' // Make admin user
        };
        
        users.push(newUser);
        localStorage.setItem('silvar_users', JSON.stringify(users));
        
        this.currentUser = { ...newUser, password: undefined };
        localStorage.setItem('silvar_user', JSON.stringify(this.currentUser));
        this.updateUI();
        alert('Registration successful!');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('silvar_user');
        this.updateUI();
        window.location.href = 'index.html';
    }

    // Balance System
    showBalanceModal() {
        const modal = this.createModal('balance-modal', `
            <div class="balance-modal">
                <h2>Add Balance</h2>
                <p>Current Balance: <span class="sapphire-balance">${this.balance} 💎</span></p>
                <p>Exchange Rate: $1 = 50 💎</p>
                <div class="balance-options">
                    <button class="btn secondary" data-amount="5">$5 - 250 💎</button>
                    <button class="btn secondary" data-amount="10">$10 - 500 💎</button>
                    <button class="btn secondary" data-amount="25">$25 - 1,250 💎</button>
                    <button class="btn secondary" data-amount="50">$50 - 2,500 💎</button>
                </div>
                <button class="btn" data-action="checkout-balance">Checkout with Stripe</button>
            </div>
        `);
        
        modal.querySelectorAll('[data-amount]').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('[data-amount]').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
        
        modal.querySelector('[data-action="checkout-balance"]').addEventListener('click', () => {
            const selected = modal.querySelector('.selected');
            if (selected) {
                const amount = parseInt(selected.dataset.amount);
                this.checkoutBalance(amount);
                modal.remove();
            } else {
                alert('Please select an amount!');
            }
        });
    }

    checkoutBalance(amount) {
        // Mock Stripe checkout
        const sapphires = amount * 50;
        this.balance += sapphires;
        localStorage.setItem('silvar_balance', this.balance.toString());
        
        if (this.currentUser) {
            this.currentUser.balance = this.balance;
            localStorage.setItem('silvar_user', JSON.stringify(this.currentUser));
        }
        
        this.updateUI();
        alert(`Successfully added ${sapphires} sapphires! 💎`);
    }

    // Cart System
    addToCart(button) {
        const item = JSON.parse(button.dataset.item);
        const existing = this.cart.find(cartItem => cartItem.id === item.id);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            this.cart.push({ ...item, quantity: 1 });
        }
        
        localStorage.setItem('silvar_cart', JSON.stringify(this.cart));
        this.updateCartDisplay();
        
        // Show success animation
        button.textContent = 'Added! ✓';
        setTimeout(() => {
            button.textContent = 'Add to Cart';
        }, 1000);
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (cartCount) cartCount.textContent = totalItems;
        if (cartTotal) cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
    }

    showCartPanel() {
        const panel = document.getElementById('cart-panel');
        const overlay = document.getElementById('cart-overlay');
        
        if (panel && overlay) {
            panel.classList.add('open');
            overlay.classList.add('open');
            this.loadCartPanel();
        } else {
            // Fallback to modal if panel doesn't exist
            this.showCartModal();
        }
    }

    closeCartPanel() {
        const panel = document.getElementById('cart-panel');
        const overlay = document.getElementById('cart-overlay');
        
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }

    loadCartPanel() {
        const cartItems = document.getElementById('cart-items');
        const cartTotalAmount = document.getElementById('cart-total-amount');
        const upsellItems = document.getElementById('upsell-items');
        
        if (!cartItems) return;
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            if (cartTotalAmount) cartTotalAmount.textContent = '$0.00';
            return;
        }

        // Load cart items
        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price} x ${item.quantity}</p>
                </div>
                <button class="btn danger small" onclick="app.removeFromCart('${item.id}')">Remove</button>
            </div>
        `).join('');

        // Update total
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartTotalAmount) cartTotalAmount.textContent = `$${total.toFixed(2)}`;

        // Load upsell items
        if (upsellItems) {
            const upsellProducts = [
                { id: 'upsell1', name: 'Bonus Knife', price: 1.50, image: 'https://via.placeholder.com/60x60/4c7fe8/ffffff?text=Knife' },
                { id: 'upsell2', name: 'Rare Gun', price: 2.00, image: 'https://via.placeholder.com/60x60/ff57a6/ffffff?text=Gun' },
                { id: 'upsell3', name: 'Special Crate', price: 0.75, image: 'https://via.placeholder.com/60x60/57ff9a/ffffff?text=Crate' }
            ];

            upsellItems.innerHTML = upsellProducts.map(item => `
                <div class="upsell-item" onclick="app.addToCart({id: '${item.id}', name: '${item.name}', price: ${item.price}, image: '${item.image}', game: 'general'})">
                    <img src="${item.image}" alt="${item.name}">
                    <h4>${item.name}</h4>
                    <span class="price">$${item.price}</span>
                </div>
            `).join('');
        }
    }

    showCartModal() {
        if (this.cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        const cartHTML = this.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price} x ${item.quantity}</p>
                </div>
                <button class="btn danger small" onclick="app.removeFromCart('${item.id}')">Remove</button>
            </div>
        `).join('');
        
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const modal = this.createModal('cart-modal', `
            <div class="cart-modal">
                <h2>Shopping Cart</h2>
                <div class="cart-items">${cartHTML}</div>
                <div class="cart-total">
                    <h3>Total: $${total.toFixed(2)}</h3>
                    <p>Your Balance: ${this.balance} 💎 ($${(this.balance / 50).toFixed(2)})</p>
                </div>
                <div class="cart-actions">
                    <button class="btn secondary" onclick="app.clearCart()">Clear Cart</button>
                    <button class="btn" data-action="checkout">Checkout</button>
                </div>
            </div>
        `);
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        localStorage.setItem('silvar_cart', JSON.stringify(this.cart));
        this.updateCartDisplay();
        this.loadCartPanel(); // Refresh panel if open
    }

    clearCart() {
        this.cart = [];
        localStorage.setItem('silvar_cart', JSON.stringify(this.cart));
        this.updateCartDisplay();
        
        // Close any open cart modals/panels
        const modal = document.querySelector('#cart-modal');
        if (modal) modal.remove();
        this.closeCartPanel();
        
        alert('Cart cleared!');
    }

    checkout() {
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const sapphireCost = Math.ceil(total * 50);
        
        if (this.balance < sapphireCost) {
            alert(`Insufficient balance! You need ${sapphireCost} 💎 but only have ${this.balance} 💎`);
            return;
        }
        
        // Process checkout
        this.balance -= sapphireCost;
        localStorage.setItem('silvar_balance', this.balance.toString());
        
        if (this.currentUser) {
            this.currentUser.balance = this.balance;
            localStorage.setItem('silvar_user', JSON.stringify(this.currentUser));
        }
        
        // Save purchase history
        const purchase = {
            id: Date.now(),
            items: [...this.cart],
            total: total,
            sapphireCost: sapphireCost,
            date: new Date().toISOString(),
            status: 'completed'
        };
        
        const history = JSON.parse(localStorage.getItem('silvar_purchases') || '[]');
        history.push(purchase);
        localStorage.setItem('silvar_purchases', JSON.stringify(history));
        
        // Add items to inventory
        const inventory = JSON.parse(localStorage.getItem('silvar_inventory') || '[]');
        this.cart.forEach(cartItem => {
            const existing = inventory.find(inv => inv.name === cartItem.name);
            if (existing) {
                existing.quantity += cartItem.quantity;
            } else {
                inventory.push({
                    ...cartItem,
                    quantity: cartItem.quantity,
                    acquired: new Date().toISOString(),
                    source: 'purchase'
                });
            }
        });
        localStorage.setItem('silvar_inventory', JSON.stringify(inventory));
        
        // Clear cart
        this.cart = [];
        localStorage.setItem('silvar_cart', JSON.stringify(this.cart));
        
        this.updateUI();
        this.closeCartPanel();
        
        // Close any cart modal
        const modal = document.querySelector('#cart-modal');
        if (modal) modal.remove();
        
        alert(`Purchase successful! ${sapphireCost} 💎 deducted from your balance.`);
        
        // Redirect to profile
        window.location.href = 'profile.html';
    }

    // Blind Box System
    openBlindBox(button) {
        const boxData = JSON.parse(button.dataset.box);
        const sapphireCost = Math.ceil(boxData.price * 50);
        
        if (this.balance < sapphireCost) {
            alert(`Insufficient balance! You need ${sapphireCost} 💎 but only have ${this.balance} 💎`);
            return;
        }
        
        // Deduct balance
        this.balance -= sapphireCost;
        localStorage.setItem('silvar_balance', this.balance.toString());
        
        // Generate random items based on box type
        const items = this.generateBlindBoxItems(boxData);
        
        // Show opening animation
        this.showBlindBoxOpening(items, boxData);
        
        this.updateUI();
    }

    generateBlindBoxItems(boxData) {
        const items = [];
        const gameItems = this.getGameItems(boxData.game);
        
        // Always get at least the value paid
        let totalValue = 0;
        const targetValue = boxData.price;
        
        while (totalValue < targetValue * 0.8) {
            const item = gameItems[Math.floor(Math.random() * gameItems.length)];
            items.push(item);
            totalValue += item.price;
        }
        
        // 1% chance for super special item
        if (Math.random() < 0.01) {
            const specialItems = gameItems.filter(item => item.rarity === 'special');
            if (specialItems.length > 0) {
                items.push(specialItems[Math.floor(Math.random() * specialItems.length)]);
            }
        }
        
        return items;
    }

    getGameItems(game) {
        const gameData = {
            'murder-mystery': [
                { name: 'Godly Knife', price: 3.00, rarity: 'legendary', image: '⚔️' },
                { name: 'Chroma Weapon', price: 8.00, rarity: 'special', image: '🌈' },
                { name: 'Rare Gun', price: 2.50, rarity: 'rare', image: '🔫' },
                { name: 'Mystery Box', price: 1.00, rarity: 'common', image: '📦' },
                { name: 'Legendary Pet', price: 4.00, rarity: 'legendary', image: '🐉' },
                { name: 'Ancient Sword', price: 15.00, rarity: 'special', image: '🗡️' }
            ],
            'grow-garden': [
                { name: 'Legendary Seed', price: 2.50, rarity: 'legendary', image: '🌱' },
                { name: 'Mythical Plant', price: 12.00, rarity: 'special', image: '🌳' },
                { name: 'Rare Flower', price: 3.50, rarity: 'rare', image: '🌸' },
                { name: 'Garden Tool Set', price: 1.50, rarity: 'common', image: '🔧' },
                { name: 'Special Fertilizer', price: 2.00, rarity: 'uncommon', image: '💧' }
            ],
            'steal-brainrot': [
                { name: 'Brainrot Blade', price: 4.00, rarity: 'legendary', image: '🧠' },
                { name: 'Epic Weapon', price: 3.50, rarity: 'epic', image: '⚔️' },
                { name: 'Stealth Cloak', price: 2.75, rarity: 'rare', image: '🥷' },
                { name: 'Power Core', price: 1.25, rarity: 'common', image: '⚡' },
                { name: 'Legendary Mask', price: 6.00, rarity: 'special', image: '🎭' }
            ]
        };
        
        return gameData[game] || gameData['murder-mystery'];
    }

    showBlindBoxOpening(items, boxData) {
        const modal = this.createModal('blindbox-opening', `
            <div class="blindbox-opening">
                <h2>🎲 Opening ${boxData.name}</h2>
                <div class="opening-animation">
                    <div class="box-shake">📦</div>
                    <p>Opening...</p>
                </div>
                <div class="revealed-items" style="display: none;">
                    ${items.map(item => `
                        <div class="revealed-item">
                            <span class="item-icon">${item.image}</span>
                            <h3>${item.name}</h3>
                            <p class="item-price">$${item.price}</p>
                            <span class="rarity ${item.rarity}">${item.rarity.toUpperCase()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
        
        // Animation sequence
        setTimeout(() => {
            modal.querySelector('.opening-animation').style.display = 'none';
            modal.querySelector('.revealed-items').style.display = 'grid';
            
            // Add to inventory
            const inventory = JSON.parse(localStorage.getItem('silvar_inventory') || '[]');
            items.forEach(item => {
                const existing = inventory.find(inv => inv.name === item.name);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    inventory.push({ ...item, quantity: 1, acquired: new Date().toISOString(), source: 'blindbox' });
                }
            });
            localStorage.setItem('silvar_inventory', JSON.stringify(inventory));
        }, 2000);
    }

    // Wheel Picker System - Fixed with proper selection flow
    spinWheel() {
        // Skip the wheel animation and go straight to selection
        this.showWheelItemSelection();
    }

    showWheelItemSelection() {
        const modal = this.createModal('wheel-selection', `
            <div class="wheel-selection">
                <h2>🎁 Choose Your Free Items</h2>
                <p>You won +3 items! Choose from the categories below:</p>
                
                <div class="selection-categories">
                    <div class="category">
                        <h3>Item 1: Cheap Items (< $1)</h3>
                        <div class="item-grid">
                            ${this.wheelItems.cheap.map(item => `
                                <div class="item-card" data-item='${JSON.stringify(item)}' data-category="cheap">
                                    <span class="item-icon">${item.image}</span>
                                    <h4>${item.name}</h4>
                                    <p>$${item.price}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="category">
                        <h3>Item 2: Cheap Items (< $1)</h3>
                        <div class="item-grid">
                            ${this.wheelItems.cheap.map(item => `
                                <div class="item-card" data-item='${JSON.stringify(item)}' data-category="cheap2">
                                    <span class="item-icon">${item.image}</span>
                                    <h4>${item.name}</h4>
                                    <p>$${item.price}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="category">
                        <h3>Item 3: Paid Item ($3+)</h3>
                        <div class="item-grid">
                            ${this.wheelItems.normal.map(item => `
                                <div class="item-card" data-item='${JSON.stringify(item)}' data-category="normal">
                                    <span class="item-icon">${item.image}</span>
                                    <h4>${item.name}</h4>
                                    <p>$${item.price}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="selection-summary">
                    <h3>Your Selection:</h3>
                    <div id="selected-items"></div>
                    <button class="btn" id="claim-items" disabled>Claim Items</button>
                </div>
            </div>
        `);
        
        const selectedItems = { cheap: null, cheap2: null, normal: null };
        const selectedItemsDisplay = modal.querySelector('#selected-items');
        const claimButton = modal.querySelector('#claim-items');
        
        modal.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                const item = JSON.parse(card.dataset.item);
                
                // Remove previous selection from same category
                modal.querySelectorAll(`[data-category="${category}"]`).forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                selectedItems[category] = item;
                
                // Update display
                const selections = Object.values(selectedItems).filter(Boolean);
                selectedItemsDisplay.innerHTML = selections.map(item => `
                    <div class="selected-item">
                        <span>${item.image} ${item.name} - $${item.price}</span>
                    </div>
                `).join('');
                
                if (selections.length === 3) {
                    claimButton.disabled = false;
                    claimButton.textContent = `Claim 3 Items ($${selections.reduce((sum, item) => sum + item.price, 0).toFixed(2)} value)`;
                }
            });
        });
        
        claimButton.addEventListener('click', () => {
            const selections = Object.values(selectedItems).filter(Boolean);
            if (selections.length === 3) {
                // Add to inventory
                const inventory = JSON.parse(localStorage.getItem('silvar_inventory') || '[]');
                selections.forEach(item => {
                    const existing = inventory.find(inv => inv.name === item.name);
                    if (existing) {
                        existing.quantity += 1;
                    } else {
                        inventory.push({ ...item, quantity: 1, acquired: new Date().toISOString(), source: 'wheel' });
                    }
                });
                localStorage.setItem('silvar_inventory', JSON.stringify(inventory));
                
                modal.remove();
                alert(`🎉 Congratulations! You claimed ${selections.length} free items!`);
            }
        });
    }

    // Utility Functions
    createModal(id, content) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close events
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());
        
        return modal;
    }

    updateUI() {
        // Update auth UI
        const authSection = document.getElementById('auth-section');
        if (authSection) {
            if (this.currentUser) {
                authSection.innerHTML = `
                    <div class="user-menu">
                        <span>Welcome, ${this.currentUser.username}!</span>
                        <div class="balance-display">${this.balance} 💎</div>
                        <button data-action="profile">Profile</button>
                        ${this.currentUser.isAdmin ? '<button data-action="admin">Admin</button>' : ''}
                        <button data-action="logout">Logout</button>
                    </div>
                `;
            } else {
                authSection.innerHTML = `
                    <button data-action="login">Login</button>
                    <button data-action="register">Register</button>
                `;
            }
        }
        
        // Update balance display
        const balanceDisplays = document.querySelectorAll('.balance-display');
        balanceDisplays.forEach(display => {
            display.textContent = `${this.balance} 💎`;
        });

        // Show admin link if user is admin
        const adminLink = document.getElementById('admin-link');
        if (adminLink && this.currentUser && this.currentUser.isAdmin) {
            adminLink.style.display = 'block';
        }
    }

    recordTransaction(type, amount, description) {
        const history = JSON.parse(localStorage.getItem('silvar_balance_history') || '[]');
        history.push({
            type: type,
            amount: amount,
            description: description,
            date: new Date().toISOString()
        });
        localStorage.setItem('silvar_balance_history', JSON.stringify(history));
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SilvarApp();
});

// Set current year
document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

// Game tab switching
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const game = btn.dataset.game;
            filterByGame(game);
        });
    });
    
    // Game selector
    const gameSelector = document.getElementById('game-selector');
    if (gameSelector) {
        gameSelector.addEventListener('change', (e) => {
            if (e.target.value) {
                window.location.href = `shop.html?game=${e.target.value}`;
            }
        });
    }
});

function filterByGame(game) {
    document.querySelectorAll('.shop-item, .box').forEach(item => {
        if (item.dataset.game === game || game === 'all') {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}