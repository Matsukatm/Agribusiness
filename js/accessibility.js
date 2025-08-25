// Accessibility Enhancement Module
class AccessibilityManager {
    constructor() {
        this.init();
    }

    init() {
        this.enhanceNavigation();
        this.addARIALabels();
        this.setupKeyboardNavigation();
        this.improveFormAccessibility();
        this.addSkipLinks();
        this.enhanceImages();
        this.setupFocusManagement();
    }

    enhanceNavigation() {
        // Add ARIA labels to navigation
        const nav = document.querySelector('nav');
        if (nav) {
            nav.setAttribute('aria-label', 'Main navigation');
        }

        // Enhance mobile menu button
        const mobileMenuButton = document.querySelector('[onclick="toggleMobileMenu()"]');
        if (mobileMenuButton) {
            mobileMenuButton.setAttribute('aria-label', 'Toggle mobile menu');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
            mobileMenuButton.setAttribute('aria-controls', 'mobileMenu');
        }

        // Add current page indicator
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath.split('/').pop() || 
                (currentPath.includes('homepage') && link.getAttribute('href') === 'homepage.html')) {
                link.setAttribute('aria-current', 'page');
                link.classList.add('font-bold');
            }
        });
    }

    addARIALabels() {
        // Search functionality
        const searchInputs = document.querySelectorAll('.search-input, input[type="search"]');
        searchInputs.forEach(input => {
            if (!input.getAttribute('aria-label')) {
                input.setAttribute('aria-label', 'Search products and services');
            }
        });

        // Cart elements
        const cartButtons = document.querySelectorAll('.add-to-cart');
        cartButtons.forEach(button => {
            const productName = button.closest('.card')?.querySelector('h3, h4')?.textContent || 'item';
            button.setAttribute('aria-label', `Add ${productName} to cart`);
        });

        // Social media links
        const socialLinks = document.querySelectorAll('a[href*="facebook"], a[href*="twitter"], a[href*="instagram"]');
        socialLinks.forEach(link => {
            const platform = link.href.includes('facebook') ? 'Facebook' : 
                            link.href.includes('twitter') ? 'Twitter' : 'Instagram';
            link.setAttribute('aria-label', `Follow us on ${platform}`);
        });

        // Phone and email links
        const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
        phoneLinks.forEach(link => {
            link.setAttribute('aria-label', `Call ${link.textContent}`);
        });

        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        emailLinks.forEach(link => {
            link.setAttribute('aria-label', `Send email to ${link.textContent}`);
        });
    }

    setupKeyboardNavigation() {
        // Ensure all interactive elements are keyboard accessible
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex') && element.tabIndex === -1) {
                element.tabIndex = 0;
            }
        });

        // Add keyboard support for custom interactive elements
        document.addEventListener('keydown', (e) => {
            // Handle Enter and Space for buttons without proper semantics
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target;
                if (target.classList.contains('add-to-cart') || 
                    target.classList.contains('btn-primary') || 
                    target.classList.contains('btn-secondary')) {
                    e.preventDefault();
                    target.click();
                }
            }

            // Handle Escape key for modals and dropdowns
            if (e.key === 'Escape') {
                this.closeModalsAndDropdowns();
            }
        });

        // Focus visible indicators
        const style = document.createElement('style');
        style.textContent = `
            .focus-visible:focus {
                outline: 2px solid #FF6B35;
                outline-offset: 2px;
            }
            
            .focus-visible:focus:not(.focus-visible) {
                outline: none;
            }
        `;
        document.head.appendChild(style);
    }

    improveFormAccessibility() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Add form labels and descriptions
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                const label = form.querySelector(`label[for="${input.id}"]`);
                if (!label && !input.getAttribute('aria-label')) {
                    // Create implicit label based on placeholder or name
                    const labelText = input.placeholder || input.name || 'Input field';
                    input.setAttribute('aria-label', labelText);
                }

                // Add required field indicators
                if (input.hasAttribute('required')) {
                    input.setAttribute('aria-required', 'true');
                    
                    // Add visual indicator
                    if (!input.nextElementSibling?.classList.contains('required-indicator')) {
                        const indicator = document.createElement('span');
                        indicator.className = 'required-indicator text-error ml-1';
                        indicator.textContent = '*';
                        indicator.setAttribute('aria-hidden', 'true');
                        input.parentNode.insertBefore(indicator, input.nextSibling);
                    }
                }

                // Add error message association
                input.addEventListener('invalid', (e) => {
                    const errorId = `${input.id || input.name}-error`;
                    input.setAttribute('aria-describedby', errorId);
                });
            });

            // Add form submission feedback
            form.addEventListener('submit', (e) => {
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.setAttribute('aria-describedby', 'form-status');
                }
            });
        });
    }

    addSkipLinks() {
        // Add skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary text-white p-2 z-50';
        skipLink.style.cssText = `
            position: absolute;
            left: -10000px;
            top: auto;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                width: auto;
                height: auto;
                overflow: visible;
                z-index: 9999;
                background: #2D5A27;
                color: white;
                padding: 8px 16px;
                text-decoration: none;
            `;
        });

        skipLink.addEventListener('blur', () => {
            skipLink.style.cssText = `
                position: absolute;
                left: -10000px;
                top: auto;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `;
        });

        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main content landmark
        const main = document.querySelector('main') || document.querySelector('.main-content');
        if (main) {
            main.id = 'main-content';
            main.setAttribute('role', 'main');
        } else {
            // Find the main content area and add ID
            const heroSection = document.querySelector('section');
            if (heroSection) {
                heroSection.id = 'main-content';
            }
        }
    }

    enhanceImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Ensure all images have alt text
            if (!img.hasAttribute('alt')) {
                // Try to derive alt text from context
                const figcaption = img.closest('figure')?.querySelector('figcaption');
                const cardTitle = img.closest('.card')?.querySelector('h3, h4');
                
                if (figcaption) {
                    img.alt = figcaption.textContent;
                } else if (cardTitle) {
                    img.alt = cardTitle.textContent;
                } else {
                    img.alt = 'Image'; // Fallback
                }
            }

            // Add loading states for better UX
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });

            img.addEventListener('error', () => {
                img.alt = 'Image failed to load';
                img.classList.add('error');
            });
        });

        // Add CSS for image states
        const imageStyles = document.createElement('style');
        imageStyles.textContent = `
            img:not(.loaded) {
                background-color: #f3f4f6;
                background-image: linear-gradient(45deg, transparent 25%, rgba(255,255,255,.5) 25%, rgba(255,255,255,.5) 75%, transparent 75%, transparent),
                                  linear-gradient(45deg, transparent 25%, rgba(255,255,255,.5) 25%, rgba(255,255,255,.5) 75%, transparent 75%, transparent);
                background-size: 20px 20px;
                background-position: 0 0, 10px 10px;
                animation: loading-shimmer 1s linear infinite;
            }
            
            @keyframes loading-shimmer {
                0% { background-position: 0 0, 10px 10px; }
                100% { background-position: 20px 20px, 30px 30px; }
            }
            
            img.error {
                background-color: #fee2e2;
                color: #dc2626;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100px;
            }
        `;
        document.head.appendChild(imageStyles);
    }

    setupFocusManagement() {
        // Track focus for better UX
        let isUsingKeyboard = false;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                isUsingKeyboard = true;
                document.body.classList.add('using-keyboard');
            }
        });

        document.addEventListener('mousedown', () => {
            isUsingKeyboard = false;
            document.body.classList.remove('using-keyboard');
        });

        // Focus management for dynamic content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Auto-focus first interactive element in new content
                            const firstInteractive = node.querySelector('button, a, input, select, textarea');
                            if (firstInteractive && isUsingKeyboard) {
                                firstInteractive.focus();
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    closeModalsAndDropdowns() {
        // Close mobile menu
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            const menuButton = document.querySelector('[aria-controls="mobileMenu"]');
            if (menuButton) {
                menuButton.setAttribute('aria-expanded', 'false');
                menuButton.focus();
            }
        }

        // Close any open dropdowns or modals
        const openDropdowns = document.querySelectorAll('.dropdown.open, .modal.open');
        openDropdowns.forEach(element => {
            element.classList.remove('open');
        });
    }

    // Public methods for dynamic content
    enhanceNewContent(container) {
        // Re-run accessibility enhancements on new content
        const images = container.querySelectorAll('img');
        images.forEach(img => this.enhanceImages());

        const buttons = container.querySelectorAll('button, .btn-primary, .btn-secondary');
        buttons.forEach(button => {
            if (!button.hasAttribute('aria-label')) {
                button.setAttribute('aria-label', button.textContent || 'Button');
            }
        });
    }

    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            announcement.remove();
        }, 1000);
    }
}

// Initialize accessibility enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
});

// Add screen reader only CSS class
const srOnlyStyles = document.createElement('style');
srOnlyStyles.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    
    .focus\\:not-sr-only:focus {
        position: static;
        width: auto;
        height: auto;
        padding: inherit;
        margin: inherit;
        overflow: visible;
        clip: auto;
        white-space: normal;
    }
`;
document.head.appendChild(srOnlyStyles);
