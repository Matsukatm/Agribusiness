// GreenGrove Market - Main JavaScript Module
class GreenGroveApp {
    constructor() {
        // Config/constants
        this.STORAGE_KEYS = {
            CART: 'greengrove_cart',
            LOGS: 'greengrove_logs',
            FAILED_LOGS: 'greengrove_failed_logs',
        };
        this.LOG_LIMIT = 1000;
        this.FAILED_LOG_LIMIT = 1000;
        this.SEARCH_MIN = 2;
        this.SEARCH_DEBOUNCE = 300;
        // API base (frontend runs on 3000, API on 4000 by default)
        this.API_BASE = window.__API_BASE__ || 'http://localhost:4000/api';

        // Intl formatter for KES
        this.currencyFormatter = new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        });

        // State
        this.cart = this.safeParse(this.STORAGE_KEYS.CART, []) || [];
        this.searchDebounceTimer = null;
        this.currentSearchToken = 0;

        this.init();
    }

    // Safe storage helpers
    safeParse(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.warn('[GreenGrove] Failed to parse storage key', key, e);
            return fallback;
        }
    }

    safeSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('[GreenGrove] Failed to set storage key', key, e);
            return false;
        }
    }

    init() {
        this.setupEventListeners();
        this.updateCartUI();
        this.initializeSearch();
        this.setupMobileMenu();
        this.logBackendProcess('App initialized');
        // Retry previously failed logs now and whenever we come back online
        this.flushFailedLogs();
        window.addEventListener('online', () => this.flushFailedLogs());
    }

    // Backend Process Logging System
    logBackendProcess(action, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            action,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Store in localStorage for persistence (with cap)
        const logs = this.safeParse(this.STORAGE_KEYS.LOGS, []);
        logs.push(logEntry);
        if (logs.length > this.LOG_LIMIT) {
            logs.splice(0, logs.length - this.LOG_LIMIT);
        }
        this.safeSet(this.STORAGE_KEYS.LOGS, logs);

        // Console log for development
        console.log(`[GreenGrove] ${action}:`, data);

        // Send to backend if available (or queue if offline)
        this.sendLogToBackend(logEntry);
    }

    async sendLogToBackend(logEntry) {
        try {
            if ('onLine' in navigator && navigator.onLine === false) {
                throw new Error('Offline');
            }
            const response = await fetch(`${this.API_BASE}/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logEntry)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            // Fallback: store failed requests for retry (capped)
            this.queueFailedLog(logEntry);
        }
    }

    queueFailedLog(logEntry) {
        const failedLogs = this.safeParse(this.STORAGE_KEYS.FAILED_LOGS, []);
        failedLogs.push(logEntry);
        if (failedLogs.length > this.FAILED_LOG_LIMIT) {
            failedLogs.splice(0, failedLogs.length - this.FAILED_LOG_LIMIT);
        }
        this.safeSet(this.STORAGE_KEYS.FAILED_LOGS, failedLogs);
    }

    async flushFailedLogs() {
        const failedLogs = this.safeParse(this.STORAGE_KEYS.FAILED_LOGS, []);
        if (!failedLogs.length) return;
        if ('onLine' in navigator && navigator.onLine === false) return;

        const remaining = [];
        for (const entry of failedLogs) {
            try {
                const response = await fetch(`${this.API_BASE}/logs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry)
                });
                if (!response.ok) throw new Error('Bad status');
            } catch (e) {
                remaining.push(entry);
            }
        }
        this.safeSet(this.STORAGE_KEYS.FAILED_LOGS, remaining);
    }

    // Cart Management
    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity = Math.max(1, (Number(existingItem.quantity) || 1) + 1);
        } else {
            const price = Number(product.price);
            this.cart.push({ ...product, price: Number.isFinite(price) ? price : 0, quantity: 1 });
        }

        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${product.name} added to cart!`, 'success');
        this.logBackendProcess('Product added to cart', product);
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
        this.logBackendProcess('Product removed from cart', { productId });
    }

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            const q = Number(quantity);
            const safeQty = Number.isFinite(q) ? Math.max(0, Math.floor(q)) : 0;
            if (safeQty === 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = safeQty;
                this.saveCart();
                this.updateCartUI();
                this.logBackendProcess('Cart quantity updated', { productId, quantity: safeQty });
            }
        }
    }

    saveCart() {
        this.safeSet(this.STORAGE_KEYS.CART, this.cart);
    }

    updateCartUI() {
        const cartCount = this.cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
        const cartCountElements = document.querySelectorAll('.cart-count');

        cartCountElements.forEach(element => {
            element.textContent = String(cartCount);
            element.style.display = cartCount > 0 ? 'block' : 'none';
        });

        // Update cart total
        const total = this.cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
        const cartTotalElements = document.querySelectorAll('.cart-total');
        cartTotalElements.forEach(element => {
            element.textContent = this.currencyFormatter.format(total);
        });
    }

    // Search Functionality
    initializeSearch() {
        const searchInputs = document.querySelectorAll('.search-input');

        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const query = (e.target.value || '').trim();

                if (query.length < this.SEARCH_MIN) {
                    this.clearSearchResults();
                    this.showSearchLoading(false);
                    return;
                }

                // Debounce and token to ensure latest result only
                if (this.searchDebounceTimer) {
                    clearTimeout(this.searchDebounceTimer);
                }
                const token = ++this.currentSearchToken;

                this.showSearchLoading(true);
                this.searchDebounceTimer = setTimeout(() => {
                    const results = this.mockSearchResults(query);
                    if (token !== this.currentSearchToken) return; // stale result
                    this.displaySearchResults(results);
                    this.showSearchLoading(false);
                    this.logBackendProcess('Search performed', { query });
                }, this.SEARCH_DEBOUNCE);
            });
        });
    }

    clearSearchResults() {
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) resultsContainer.textContent = '';
    }

    performSearch(query) {
        // Legacy method kept for compatibility; now handled by initializeSearch with debounce
        if (typeof query !== 'string' || query.length < this.SEARCH_MIN) {
            this.clearSearchResults();
            this.showSearchLoading(false);
            return;
        }
        this.logBackendProcess('Search performed', { query });
        this.showSearchLoading(true);
        setTimeout(() => {
            const results = this.mockSearchResults(query);
            this.displaySearchResults(results);
            this.showSearchLoading(false);
        }, this.SEARCH_DEBOUNCE);
    }

    mockSearchResults(query) {
        const mockProducts = [
            { id: 1, name: 'Fresh Tomatoes', price: 150, category: 'vegetables' },
            { id: 2, name: 'Organic Spinach', price: 120, category: 'vegetables' },
            { id: 3, name: 'Ripe Mangoes', price: 200, category: 'fruits' },
            { id: 4, name: 'Garden Design Service', price: 5000, category: 'services' }
        ];

        return mockProducts.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        );
    }

    displaySearchResults(results) {
        const resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) return;

        // Clear previous
        resultsContainer.textContent = '';

        if (!Array.isArray(results) || results.length === 0) {
            const p = document.createElement('p');
            p.className = 'text-text-secondary p-4';
            p.textContent = 'No results found';
            resultsContainer.appendChild(p);
            return;
        }

        results.forEach(product => {
            const item = document.createElement('div');
            item.className = 'search-result-item p-3 hover:bg-surface cursor-pointer border-b border-border-light';

            const title = document.createElement('h4');
            title.className = 'font-medium text-primary';
            title.textContent = product.name;

            const price = document.createElement('p');
            price.className = 'text-sm text-text-secondary';
            price.textContent = this.currencyFormatter.format(Number(product.price) || 0);

            item.appendChild(title);
            item.appendChild(price);
            resultsContainer.appendChild(item);
        });
    }

    showSearchLoading(show) {
        const loadingElements = document.querySelectorAll('.search-loading');
        loadingElements.forEach(element => {
            element.style.display = show ? 'block' : 'none';
        });
    }

    // Mobile Menu
    setupMobileMenu() {
        // Prefer explicit selectors; fallback to inline onclick target but avoid double-binding
        const menuButton = document.querySelector('[data-action="toggle-mobile-menu"], .mobile-menu-toggle, [aria-controls="mobileMenu"]')
            || document.querySelector('[onclick="toggleMobileMenu()"]');
        const mobileMenu = document.getElementById('mobileMenu');

        if (menuButton && mobileMenu) {
            const hasInline = (menuButton.getAttribute('onclick') || '').includes('toggleMobileMenu()');
            if (!hasInline) {
                menuButton.addEventListener('click', (e) => {
                    // Only prevent default for anchors
                    if (menuButton.tagName === 'A') e.preventDefault();
                    this.toggleMobileMenu();
                });
            }
        }
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
            this.logBackendProcess('Mobile menu toggled');
        }
    }

    // Form Handling & general events
    setupEventListeners() {
        // Add to cart buttons (robust to nested clicks)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest ? e.target.closest('.add-to-cart') : null;
            if (btn) {
                e.preventDefault();
                let productData = {};
                try {
                    productData = JSON.parse(btn.dataset.product || '{}');
                } catch (err) {
                    console.warn('[GreenGrove] invalid product JSON on .add-to-cart');
                }
                this.addToCart(productData);
            }
        });

        // Unified form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (!(form instanceof HTMLFormElement)) return;
            if (form.classList.contains('contact-form')) {
                e.preventDefault();
                this.handleContactForm(form);
            } else if (form.classList.contains('newsletter-form')) {
                e.preventDefault();
                this.handleNewsletterSignup(form);
            } else if (form.classList.contains('checkout-form')) {
                e.preventDefault();
                this.handleCheckoutForm(form);
            } else if (form.classList.contains('service-booking-form')) {
                e.preventDefault();
                this.handleServiceBookingForm(form);
            }
        });
    }

    async handleContactForm(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        this.showFormLoading(form, true);
        this.logBackendProcess('Contact form submitted', { email: data.email });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.showNotification('Message sent successfully!', 'success');
            form.reset();
            this.logBackendProcess('Contact form success', { email: data.email });
        } catch (error) {
            this.showNotification('Failed to send message. Please try again.', 'error');
            this.logBackendProcess('Contact form error', { error: error.message });
        } finally {
            this.showFormLoading(form, false);
        }
    }

    async handleNewsletterSignup(form) {
        const formData = new FormData(form);
        const email = formData.get('email');

        this.showFormLoading(form, true);
        this.logBackendProcess('Newsletter signup', { email });

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            this.showNotification('Successfully subscribed to newsletter!', 'success');
            form.reset();
            this.logBackendProcess('Newsletter signup success', { email });
        } catch (error) {
            this.showNotification('Signup failed. Please try again.', 'error');
            this.logBackendProcess('Newsletter signup error', { error: error.message });
        } finally {
            this.showFormLoading(form, false);
        }
    }

    // API helpers and DB-backed flows
    async fetchJSON(url, options = {}) {
        const resp = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Request failed: ${resp.status} ${text}`);
        }
        return resp.json();
    }

    async handleCheckoutForm(form) {
        const formData = new FormData(form);
        const userId = Number(formData.get('user_id')) || 0;
        const address = (formData.get('delivery_address') || '').toString();
        const paymentMethod = (formData.get('payment_method') || 'Mpesa').toString();

        if (!userId) {
            this.showNotification('Please sign in to checkout.', 'error');
            return;
        }
        if (!this.cart.length) {
            this.showNotification('Your cart is empty.', 'error');
            return;
        }

        this.showFormLoading(form, true);
        try {
            const payload = {
                user_id: userId,
                delivery_address: address,
                items: this.cart.map(i => ({ product_id: i.id, quantity: i.quantity }))
            };
            const order = await this.fetchJSON(`${this.API_BASE}/orders`, { method: 'POST', body: JSON.stringify(payload) });
            this.logBackendProcess('Order created', { orderId: order.id, total: order.total_amount });

            // Create a pending payment record; in production wait for provider webhook
            const payment = await this.fetchJSON(`${this.API_BASE}/payments`, {
                method: 'POST',
                body: JSON.stringify({ user_id: userId, order_id: order.id, amount: order.total_amount, payment_method: paymentMethod })
            });
            this.logBackendProcess('Payment initiated', { paymentId: payment.id, method: paymentMethod });

            // Success UX
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            this.showNotification('Order placed! Payment pending confirmation.', 'success');
        } catch (err) {
            this.showNotification('Checkout failed. ' + err.message, 'error');
            this.logBackendProcess('Checkout error', { error: err.message });
        } finally {
            this.showFormLoading(form, false);
        }
    }

    async handleServiceBookingForm(form) {
        const formData = new FormData(form);
        const userId = Number(formData.get('user_id')) || 0;
        const serviceId = Number(formData.get('service_id')) || 0;
        const bookingDate = formData.get('booking_date');
        const notes = (formData.get('notes') || '').toString();
        const address = (formData.get('address') || '').toString();

        if (!userId || !serviceId || !bookingDate) {
            this.showNotification('Please provide all booking details.', 'error');
            return;
        }

        this.showFormLoading(form, true);
        try {
            const resp = await this.fetchJSON(`${this.API_BASE}/bookings`, {
                method: 'POST',
                body: JSON.stringify({ user_id: userId, service_id: serviceId, booking_date: bookingDate, notes, address })
            });
            this.logBackendProcess('Service booking created', { bookingId: resp.id });
            this.showNotification('Booking created! We will confirm shortly.', 'success');
            form.reset();
        } catch (err) {
            this.showNotification('Booking failed. ' + err.message, 'error');
            this.logBackendProcess('Booking error', { error: err.message });
        } finally {
            this.showFormLoading(form, false);
        }
    }

    // UI Helpers
    showFormLoading(form, show) {
        const submitButton = form.querySelector('button[type="submit"]');
        const loadingSpinner = form.querySelector('.loading-spinner');

        if (submitButton) {
            if (show) {
                if (!submitButton.dataset.originalText) {
                    submitButton.dataset.originalText = (submitButton.textContent || '').trim();
                }
                submitButton.disabled = true;
                submitButton.textContent = submitButton.dataset.sendingText || 'Sending...';
            } else {
                submitButton.disabled = false;
                const original = submitButton.dataset.originalText || submitButton.textContent || 'Send';
                submitButton.textContent = original;
            }
        }

        if (loadingSpinner) {
            loadingSpinner.style.display = show ? 'block' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const isError = type === 'error';
        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 opacity-0 ${
            type === 'success' ? 'bg-success text-white' :
            isError ? 'bg-error text-white' :
            'bg-primary text-white'
        }`;
        notification.setAttribute('role', isError ? 'alert' : 'status');
        notification.setAttribute('aria-live', isError ? 'assertive' : 'polite');

        // Content container
        const content = document.createElement('span');
        content.textContent = message;
        notification.appendChild(content);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'ml-3 underline';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.textContent = 'Dismiss';
        closeBtn.addEventListener('click', () => notification.remove());
        notification.appendChild(closeBtn);

        document.body.appendChild(notification);

        // Animate in
        const animateIn = () => notification.classList.add('opacity-100');
        const animateOut = () => {
            notification.classList.add('opacity-0');
            setTimeout(() => notification.remove(), 300);
        };

        if (!prefersReducedMotion) {
            setTimeout(animateIn, 10);
            setTimeout(animateOut, 3000);
        } else {
            // Reduced motion: no fade, just remove after delay
            setTimeout(() => notification.remove(), 3000);
        }
    }

    // Log Management
    getLogs() {
        return this.safeParse(this.STORAGE_KEYS.LOGS, []);
    }

    clearLogs() {
        try { localStorage.removeItem(this.STORAGE_KEYS.LOGS); } catch (e) {}
        try { localStorage.removeItem(this.STORAGE_KEYS.FAILED_LOGS); } catch (e) {}
        this.logBackendProcess('Logs cleared');
    }

    exportLogs() {
        const logs = this.getLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `greengrove-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        try { URL.revokeObjectURL(link.href); } catch (e) {}

        this.logBackendProcess('Logs exported');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.greenGroveApp = new GreenGroveApp();
});

// Global functions for backward compatibility
function toggleMobileMenu() {
    if (window.greenGroveApp) {
        window.greenGroveApp.toggleMobileMenu();
    }
}
