/**
 * Test Setup - Load carrier classes and mock browser environment
 */

const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = {};
global.console = console;

// Mock localStorage for storage tests
const mockLocalStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    },
    clear() {
        this.data = {};
    }
};

global.localStorage = mockLocalStorage;

// Mock document for DOM-related tests
global.document = {
    readyState: 'complete',
    addEventListener: () => {},
    createElement: () => ({
        textContent: '',
        appendChild: () => {}
    })
};

/**
 * Propagate window properties to global scope
 */
function propagateGlobals() {
    if (global.window) {
        Object.keys(global.window).forEach(key => {
            if (!global[key]) {
                global[key] = global.window[key];
            }
        });
    }
}

/**
 * Load and evaluate JavaScript files in order
 */
function loadScript(relativePath) {
    const fullPath = path.join(__dirname, '..', relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    try {
        // Execute the script in global context
        eval(content);
        console.log(`✓ Loaded: ${relativePath}`);
    } catch (error) {
        console.error(`✗ Failed to load ${relativePath}:`, error.message);
        throw error;
    }
}

/**
 * Initialize test environment
 */
function setupTestEnvironment() {
    console.log('🔧 Setting up test environment...\n');
    
    try {
        // Load scripts in dependency order and propagate globals after each
        loadScript('js/carriers/base.js');
        propagateGlobals();
        
        loadScript('js/carriers/usps.js');
        propagateGlobals();
        
        loadScript('js/carriers/ups.js');
        propagateGlobals();
        
        loadScript('js/carriers/fedex.js');
        propagateGlobals();
        
        loadScript('js/carriers/dhl.js');
        propagateGlobals();
        
        loadScript('js/trackerRegistry.js');
        propagateGlobals();
        
        loadScript('js/storage.js');
        propagateGlobals();
        
        console.log('\n✅ Test environment ready!\n');
        
        return {
            BaseCarrier: global.window.BaseCarrier,
            USPSCarrier: global.window.USPSCarrier,
            UPSCarrier: global.window.UPSCarrier,
            FedExCarrier: global.window.FedExCarrier,
            DHLCarrier: global.window.DHLCarrier,
            TrackerRegistry: global.window.TrackerRegistry,
            StorageManager: global.window.StorageManager,
            trackerRegistry: global.window.trackerRegistry,
            storageManager: global.window.storageManager
        };
    } catch (error) {
        console.error('❌ Failed to setup test environment:', error);
        throw error;
    }
}

module.exports = {
    setupTestEnvironment,
    mockLocalStorage
}; 