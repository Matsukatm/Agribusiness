// Error Handling and Loading States Module
class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        this.setupGlobalErrorHandling();
        this.setupLoadingStates();
        this.setupOfflineDetection();
        this.setupFormValidation();
    }

    setupGlobalErrorHandling() {
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });

        // Handle network errors
        window.addEventListener('offline', () => {
            this.showOfflineMessage();
        });

        window.addEventListener('online', () => {
            this.hideOfflineMessage();
        });
    }

    setupLoadingStates() {
        // Create loading overlay
        this.createLoadingOverlay();
        
        // Intercept fetch requests to show loading states
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            this.showLoading();
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response;
            } catch (error) {
                this.handleNetworkError(error);
                throw error;
            } finally {
                this.hideLoading();
            }
        };
    }

    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 flex items-center space-x-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span class="text-primary font-medium">Loading...</span>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.querySelector('span').textContent = message;
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    }

    setupOfflineDetection() {
        if (!navigator.onLine) {
            this.showOfflineMessage();
        }
    }

    showOfflineMessage() {
        const offlineBar = document.createElement('div');
        offlineBar.id = 'offline-bar';
        offlineBar.className = 'fixed top-0 left-0 right-0 bg-error text-white text-center py-2 z-50';
        offlineBar.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <span>You're offline. Some features may not work properly.</span>
            </div>
        `;
        
        if (!document.getElementById('offline-bar')) {
            document.body.insertBefore(offlineBar, document.body.firstChild);
        }
    }

    hideOfflineMessage() {
        const offlineBar = document.getElementById('offline-bar');
        if (offlineBar) {
            offlineBar.remove();
        }
    }

    setupFormValidation() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            }
        });

        // Real-time validation
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.validateField(e.target);
            }
        });
    }

    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name || field.id || 'Field';
        let isValid = true;
        let errorMessage = '';

        // Remove existing error styling
        field.classList.remove('border-error');
        this.removeFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            errorMessage = `${fieldName} is required`;
            isValid = false;
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errorMessage = 'Please enter a valid email address';
                isValid = false;
            }
        }

        // Phone validation (Kenyan format)
        if (field.type === 'tel' && value) {
            const phoneRegex = /^(\+254|0)[17]\d{8}$/;
            if (!phoneRegex.test(value)) {
                errorMessage = 'Please enter a valid Kenyan phone number';
                isValid = false;
            }
        }

        // Minimum length validation
        if (field.hasAttribute('minlength')) {
            const minLength = parseInt(field.getAttribute('minlength'));
            if (value.length < minLength) {
                errorMessage = `${fieldName} must be at least ${minLength} characters long`;
                isValid = false;
            }
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('border-error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error text-error text-sm mt-1';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    removeFieldError(field) {
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    handleNetworkError(error) {
        let message = 'Network error occurred';
        
        if (error.message.includes('Failed to fetch')) {
            message = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('HTTP 404')) {
            message = 'The requested resource was not found.';
        } else if (error.message.includes('HTTP 500')) {
            message = 'Server error occurred. Please try again later.';
        }

        this.showErrorNotification(message);
        this.logError('Network Error', { error: error.message, url: window.location.href });
    }

    showErrorNotification(message, duration = 5000) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-error text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        notification.innerHTML = `
            <div class="flex items-start space-x-3">
                <svg class="h-5 w-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <div class="flex-1">
                    <p class="font-medium">Error</p>
                    <p class="text-sm opacity-90">${message}</p>
                </div>
                <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    logError(type, details) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            type,
            details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Store in localStorage
        const errorLogs = JSON.parse(localStorage.getItem('greengrove_error_logs')) || [];
        errorLogs.push(errorLog);
        
        // Keep only last 100 error logs
        if (errorLogs.length > 100) {
            errorLogs.splice(0, errorLogs.length - 100);
        }
        
        localStorage.setItem('greengrove_error_logs', JSON.stringify(errorLogs));
        
        // Log to console in development
        console.error(`[GreenGrove Error] ${type}:`, details);
        
        // Send to backend logging if available
        if (window.greenGroveApp) {
            window.greenGroveApp.logBackendProcess(`Error: ${type}`, details);
        }
    }

    // Public methods for manual error handling
    showError(message) {
        this.showErrorNotification(message);
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-success text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    getErrorLogs() {
        return JSON.parse(localStorage.getItem('greengrove_error_logs')) || [];
    }

    clearErrorLogs() {
        localStorage.removeItem('greengrove_error_logs');
    }
}

// Initialize error handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.errorHandler = new ErrorHandler();
});
