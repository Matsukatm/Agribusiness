#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildOptimizer {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.buildDir = path.join(this.projectRoot, 'dist');
        this.logFile = path.join(this.projectRoot, 'build.log');
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        
        console.log(message);
        fs.appendFileSync(this.logFile, logEntry);
    }

    async optimizeImages() {
        this.log('Starting image optimization...');
        
        const imageDir = path.join(this.projectRoot, 'images');
        const optimizedDir = path.join(imageDir, 'optimized');
        
        // Create optimized directory if it doesn't exist
        if (!fs.existsSync(optimizedDir)) {
            fs.mkdirSync(optimizedDir, { recursive: true });
        }

        // Mock image optimization (in real scenario, use sharp or imagemin)
        const mockImages = [
            'vegetables-fresh.jpg',
            'fruits-tropical.jpg',
            'garden-design.jpg',
            'plant-care.jpg'
        ];

        mockImages.forEach(imageName => {
            const mockPath = path.join(optimizedDir, imageName);
            if (!fs.existsSync(mockPath)) {
                fs.writeFileSync(mockPath, '// Optimized image placeholder');
                this.log(`Optimized: ${imageName}`);
            }
        });

        this.log('Image optimization completed');
    }

    async buildCSS() {
        this.log('Building CSS...');
        
        try {
            execSync('npm run build:css', { 
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            this.log('CSS build completed successfully');
        } catch (error) {
            this.log(`CSS build failed: ${error.message}`);
            throw error;
        }
    }

    async minifyAssets() {
        this.log('Minifying assets...');
        
        const cssFile = path.join(this.projectRoot, 'css', 'main.css');
        const jsFile = path.join(this.projectRoot, 'js', 'main.js');
        
        if (fs.existsSync(cssFile)) {
            const cssContent = fs.readFileSync(cssFile, 'utf8');
            const minifiedCSS = cssContent
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .trim();
            
            const minifiedCSSFile = path.join(this.buildDir, 'main.min.css');
            fs.writeFileSync(minifiedCSSFile, minifiedCSS);
            this.log(`CSS minified: ${minifiedCSSFile}`);
        }

        if (fs.existsSync(jsFile)) {
            const jsContent = fs.readFileSync(jsFile, 'utf8');
            // Basic minification (in production, use terser or uglify)
            const minifiedJS = jsContent
                .replace(/\/\/.*$/gm, '') // Remove single-line comments
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .trim();
            
            const minifiedJSFile = path.join(this.buildDir, 'main.min.js');
            fs.writeFileSync(minifiedJSFile, minifiedJS);
            this.log(`JS minified: ${minifiedJSFile}`);
        }
    }

    async generateSitemap() {
        this.log('Generating sitemap...');
        
        const pages = [
            '',
            'pages/homepage.html',
            'pages/product_marketplace.html',
            'pages/garden_services_hub.html',
            'pages/knowledge_center.html',
            'pages/customer_dashboard.html',
            'pages/contact_support.html'
        ];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `    <url>
        <loc>https://greengrove.co.ke/${page}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>`).join('\n')}
</urlset>`;

        fs.writeFileSync(path.join(this.buildDir, 'sitemap.xml'), sitemap);
        this.log('Sitemap generated');
    }

    async build() {
        this.log('Starting build process...');
        
        // Create build directory
        if (!fs.existsSync(this.buildDir)) {
            fs.mkdirSync(this.buildDir, { recursive: true });
        }

        try {
            await this.buildCSS();
            await this.optimizeImages();
            await this.minifyAssets();
            await this.generateSitemap();
            
            this.log('Build process completed successfully!');
        } catch (error) {
            this.log(`Build process failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const optimizer = new BuildOptimizer();
    optimizer.build();
}

module.exports = BuildOptimizer;
