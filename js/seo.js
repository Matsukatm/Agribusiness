// SEO and Structured Data Module
class SEOManager {
    constructor() {
        this.baseUrl = 'https://greengrove.co.ke';
        this.init();
    }

    init() {
        this.addStructuredData();
        this.optimizeMetaTags();
        this.addOpenGraphTags();
        this.addTwitterCardTags();
    }

    addStructuredData() {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "GreenGrove Market",
            "description": "Kenya's premier seed-to-table ecosystem. Fresh grocery delivery and professional garden services in Nairobi.",
            "url": this.baseUrl,
            "logo": `${this.baseUrl}/images/logo.png`,
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+254-700-123-456",
                "contactType": "customer service",
                "areaServed": "KE",
                "availableLanguage": ["English", "Swahili"]
            },
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Westlands",
                "addressLocality": "Nairobi",
                "addressCountry": "KE"
            },
            "sameAs": [
                "https://facebook.com/greengrovemarket",
                "https://twitter.com/greengrovemarket",
                "https://instagram.com/greengrovemarket"
            ],
            "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "KES",
                "availability": "https://schema.org/InStock"
            }
        };

        // Add product structured data if on product page
        if (window.location.pathname.includes('product_marketplace')) {
            this.addProductStructuredData();
        }

        // Add service structured data if on services page
        if (window.location.pathname.includes('garden_services')) {
            this.addServiceStructuredData();
        }

        this.insertStructuredData(structuredData);
    }

    addProductStructuredData() {
        const products = [
            {
                "@type": "Product",
                "name": "Fresh Vegetables Bundle",
                "description": "Premium fresh vegetables delivered within 48 hours",
                "image": `${this.baseUrl}/images/products/vegetables-fresh.jpg`,
                "offers": {
                    "@type": "Offer",
                    "price": "500",
                    "priceCurrency": "KES",
                    "availability": "https://schema.org/InStock",
                    "seller": {
                        "@type": "Organization",
                        "name": "GreenGrove Market"
                    }
                },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "reviewCount": "127"
                }
            },
            {
                "@type": "Product",
                "name": "Tropical Fruits Selection",
                "description": "Seasonal tropical fruits including mangoes, pineapples, and passion fruits",
                "image": `${this.baseUrl}/images/products/fruits-tropical.jpg`,
                "offers": {
                    "@type": "Offer",
                    "price": "800",
                    "priceCurrency": "KES",
                    "availability": "https://schema.org/InStock"
                }
            }
        ];

        products.forEach(product => this.insertStructuredData(product));
    }

    addServiceStructuredData() {
        const services = [
            {
                "@type": "Service",
                "name": "Garden Design & Installation",
                "description": "Professional garden design and installation services for residential and commercial properties",
                "provider": {
                    "@type": "Organization",
                    "name": "GreenGrove Market"
                },
                "areaServed": {
                    "@type": "City",
                    "name": "Nairobi"
                },
                "offers": {
                    "@type": "Offer",
                    "price": "15000",
                    "priceCurrency": "KES"
                }
            },
            {
                "@type": "Service",
                "name": "Garden Maintenance",
                "description": "Regular garden maintenance and plant care services",
                "provider": {
                    "@type": "Organization",
                    "name": "GreenGrove Market"
                }
            }
        ];

        services.forEach(service => this.insertStructuredData(service));
    }

    insertStructuredData(data) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
    }

    optimizeMetaTags() {
        const pageTitle = this.getPageTitle();
        const pageDescription = this.getPageDescription();
        const pageKeywords = this.getPageKeywords();

        // Update title
        document.title = pageTitle;

        // Update or add meta description
        this.updateMetaTag('description', pageDescription);
        this.updateMetaTag('keywords', pageKeywords);
        
        // Add viewport meta tag if not present
        if (!document.querySelector('meta[name="viewport"]')) {
            this.addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
        }

        // Add robots meta tag
        this.updateMetaTag('robots', 'index, follow');
        
        // Add author
        this.updateMetaTag('author', 'GreenGrove Market');
    }

    getPageTitle() {
        const path = window.location.pathname;
        const titles = {
            '/': 'GreenGrove Market - Living Fresh, Growing Forward | Kenya\'s Premier Garden Marketplace',
            '/pages/homepage.html': 'GreenGrove Market - Living Fresh, Growing Forward | Kenya\'s Premier Garden Marketplace',
            '/pages/product_marketplace.html': 'Fresh Groceries Online | GreenGrove Market Kenya',
            '/pages/garden_services_hub.html': 'Professional Garden Services | GreenGrove Market Nairobi',
            '/pages/knowledge_center.html': 'Garden Knowledge & Tips | GreenGrove Market Learning Center',
            '/pages/customer_dashboard.html': 'My Account | GreenGrove Market Dashboard',
            '/pages/contact_support.html': 'Contact Us | GreenGrove Market Support'
        };

        return titles[path] || 'GreenGrove Market - Kenya\'s Premier Garden Marketplace';
    }

    getPageDescription() {
        const path = window.location.pathname;
        const descriptions = {
            '/': 'Kenya\'s first premium seed-to-table ecosystem. Fresh groceries delivered to your door in 48hrs, expert garden services for your space. Serving Nairobi with quality and sustainability.',
            '/pages/homepage.html': 'Kenya\'s first premium seed-to-table ecosystem. Fresh groceries delivered to your door in 48hrs, expert garden services for your space. Serving Nairobi with quality and sustainability.',
            '/pages/product_marketplace.html': 'Shop fresh vegetables, tropical fruits, and organic produce online. Fast 48-hour delivery across Nairobi. Quality guaranteed, sustainably sourced from local farmers.',
            '/pages/garden_services_hub.html': 'Professional garden design, installation, and maintenance services in Nairobi. Transform your space with expert consultation and ongoing plant care support.',
            '/pages/knowledge_center.html': 'Learn gardening tips, plant care guides, and sustainable growing practices. Expert advice for beginners and experienced gardeners in Kenya\'s climate.',
            '/pages/customer_dashboard.html': 'Manage your GreenGrove Market account, track orders, view purchase history, and access personalized garden recommendations.',
            '/pages/contact_support.html': 'Get help with orders, garden services, or general inquiries. Contact GreenGrove Market support team for assistance across Nairobi.'
        };

        return descriptions[path] || 'GreenGrove Market - Kenya\'s premier marketplace for fresh groceries and professional garden services.';
    }

    getPageKeywords() {
        const path = window.location.pathname;
        const keywords = {
            '/': 'fresh groceries Kenya, garden services Nairobi, organic vegetables, tropical fruits, plant care, sustainable farming',
            '/pages/homepage.html': 'fresh groceries Kenya, garden services Nairobi, organic vegetables, tropical fruits, plant care, sustainable farming',
            '/pages/product_marketplace.html': 'buy vegetables online Kenya, fresh fruits Nairobi, organic produce delivery, grocery shopping online',
            '/pages/garden_services_hub.html': 'garden design Nairobi, landscaping services Kenya, plant installation, garden maintenance',
            '/pages/knowledge_center.html': 'gardening tips Kenya, plant care guide, sustainable gardening, growing vegetables Nairobi',
            '/pages/customer_dashboard.html': 'GreenGrove account, order tracking, purchase history, garden recommendations',
            '/pages/contact_support.html': 'GreenGrove support, customer service Kenya, garden help, order assistance'
        };

        return keywords[path] || 'GreenGrove Market, Kenya, fresh groceries, garden services, Nairobi';
    }

    addOpenGraphTags() {
        const ogTags = {
            'og:title': this.getPageTitle(),
            'og:description': this.getPageDescription(),
            'og:type': 'website',
            'og:url': window.location.href,
            'og:image': `${this.baseUrl}/images/og-image.jpg`,
            'og:site_name': 'GreenGrove Market',
            'og:locale': 'en_KE'
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            this.updateMetaProperty(property, content);
        });
    }

    addTwitterCardTags() {
        const twitterTags = {
            'twitter:card': 'summary_large_image',
            'twitter:site': '@greengrovemarket',
            'twitter:title': this.getPageTitle(),
            'twitter:description': this.getPageDescription(),
            'twitter:image': `${this.baseUrl}/images/twitter-card.jpg`
        };

        Object.entries(twitterTags).forEach(([name, content]) => {
            this.updateMetaTag(name, content);
        });
    }

    updateMetaTag(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    updateMetaProperty(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    }

    addMetaTag(name, content) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
    }
}

// Initialize SEO when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SEOManager();
});
