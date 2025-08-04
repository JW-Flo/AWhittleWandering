#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function validateWebsite() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set up console logging to capture any errors
        page.on('console', msg => {
            console.log('BROWSER LOG:', msg.type(), msg.text());
        });
        
        page.on('pageerror', error => {
            console.log('PAGE ERROR:', error.message);
            console.log('ERROR STACK:', error.stack);
        });
        
        page.on('requestfailed', request => {
            console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
        });
        
        console.log('🔍 Testing https://26d2ee84.awhittlewandering-site.pages.dev...');
        
        // Navigate to the website
        await page.goto('https://26d2ee84.awhittlewandering-site.pages.dev', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for React to render
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if the root div has content
        const rootContent = await page.$eval('#root', el => el.innerHTML);
        
        if (rootContent.trim().length > 0) {
            console.log('✅ SUCCESS: Website is rendering content');
            console.log(`📏 Root content length: ${rootContent.length} characters`);
            
            // Check for specific elements that should exist
            const hasNavigation = await page.$('nav') !== null;
            const hasContent = await page.$('main, .content, [class*="app"]') !== null;
            
            console.log(`🧭 Navigation found: ${hasNavigation}`);
            console.log(`📄 Content area found: ${hasContent}`);
            
            // Get page title
            const title = await page.title();
            console.log(`📖 Page title: "${title}"`);
            
            return true;
        } else {
            console.log('❌ FAILURE: Root div is empty - React app not rendering');
            return false;
        }
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the validation
validateWebsite().then(success => {
    process.exit(success ? 0 : 1);
});
