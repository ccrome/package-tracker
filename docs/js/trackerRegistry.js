/**
 * Tracker Registry - Manages all carriers and provides unified tracking interface
 */
class TrackerRegistry {
    constructor() {
        this.carriers = new Map();
        this.initializeCarriers();
    }

    /**
     * Initialize all available carriers
     */
    initializeCarriers() {
        // Register all carriers with safety checks
        try {
            if (window.USPSCarrier) {
                this.registerCarrier(new USPSCarrier());
            } else {
                console.warn('USPSCarrier not available');
            }
        } catch (error) {
            console.error('Failed to register USPS carrier:', error);
        }

        try {
            if (window.UPSCarrier) {
                this.registerCarrier(new UPSCarrier());
            } else {
                console.warn('UPSCarrier not available');
            }
        } catch (error) {
            console.error('Failed to register UPS carrier:', error);
        }

        try {
            if (window.FedExCarrier) {
                this.registerCarrier(new FedExCarrier());
            } else {
                console.warn('FedExCarrier not available');
            }
        } catch (error) {
            console.error('Failed to register FedEx carrier:', error);
        }

        try {
            if (window.DHLCarrier) {
                this.registerCarrier(new DHLCarrier());
            } else {
                console.warn('DHLCarrier not available');
            }
        } catch (error) {
            console.error('Failed to register DHL carrier:', error);
        }

        console.log(`TrackerRegistry initialized with ${this.carriers.size} carriers`);
    }

    /**
     * Register a new carrier
     * @param {BaseCarrier} carrier - Carrier instance
     */
    registerCarrier(carrier) {
        if (!(carrier instanceof BaseCarrier)) {
            throw new Error('Carrier must extend BaseCarrier');
        }
        
        if (!this.carriers.has(carrier.code)) {
            this.carriers.set(carrier.code, carrier);
            console.log(`Registered carrier: ${carrier.name} (${carrier.code})`);
            
            // If this is the first carrier registered, trigger re-detection of any cached packages
            if (this.carriers.size === 1 && window.storageManager) {
                console.log('First carrier registered - checking for packages needing re-detection...');
                setTimeout(() => {
                    if (window.storageManager && window.storageManager.forceRedetectCarriers) {
                        window.storageManager.forceRedetectCarriers();
                    }
                }, 100);
            }
        }
    }

    /**
     * Get all registered carriers
     * @returns {Array} Array of carrier objects
     */
    getAllCarriers() {
        return Array.from(this.carriers.values());
    }

    /**
     * Get carrier by code
     * @param {string} code - Carrier code
     * @returns {BaseCarrier|null} Carrier instance or null
     */
    getCarrier(code) {
        return this.carriers.get(code) || null;
    }

    /**
     * Detect which carrier can handle a tracking number
     * @param {string} trackingNumber - The tracking number to check
     * @returns {BaseCarrier|null} Carrier that can handle the tracking number or null
     */
    detectCarrier(trackingNumber) {
        if (!trackingNumber || trackingNumber.trim() === '') {
            return null;
        }

        const cleaned = trackingNumber.replace(/\s+/g, '').toUpperCase();
        
        // Try each carrier in order of specificity
        // UPS first since it has very specific format
        const orderedCarriers = [
            this.carriers.get('ups'),
            this.carriers.get('fedex'),
            this.carriers.get('dhl'),
            this.carriers.get('usps') // USPS last since it has broad patterns
        ];

        for (const carrier of orderedCarriers) {
            if (carrier && carrier.matches(cleaned)) {
                return carrier;
            }
        }

        return null;
    }

    /**
     * Track a package using the appropriate carrier
     * @param {string} trackingNumber - The tracking number
     * @param {string} carrierCode - Optional carrier code to force specific carrier
     * @returns {Promise<Object>} Tracking result
     */
    async trackPackage(trackingNumber, carrierCode = null) {
        try {
            let carrier;
            
            if (carrierCode && carrierCode !== 'unknown') {
                carrier = this.getCarrier(carrierCode);
                if (!carrier) {
                    throw new Error(`Unknown carrier code: ${carrierCode}`);
                }
            } else {
                // Always try to detect carrier, even if carrierCode was provided but is 'unknown'
                carrier = this.detectCarrier(trackingNumber);
                if (!carrier) {
                    throw new Error(`Unable to detect carrier for tracking number: ${trackingNumber}`);
                }
            }

            console.log(`Tracking ${trackingNumber} with ${carrier.name}`);
            const result = await carrier.track(trackingNumber);
            
            // Add carrier info to result
            result.carrier = { name: carrier.name, code: carrier.code };
            result.trackingUrl = carrier.getUrl(trackingNumber);
            
            return result;
            
        } catch (error) {
            console.error('Tracking error:', error);
            return {
                status: 'unavailable',
                statusDescription: 'Click "View on Carrier" below for official tracking information.',
                lastChecked: new Date().toISOString(),
                dataUnavailable: true,
                carrier: carrierCode ? { code: carrierCode, name: 'Unknown' } : null
            };
        }
    }

    /**
     * Track multiple packages in parallel
     * @param {Array} trackingNumbers - Array of tracking numbers
     * @returns {Promise<Array>} Array of tracking results
     */
    async trackMultiplePackages(trackingNumbers) {
        const trackingPromises = trackingNumbers.map(trackingNumber => 
            this.trackPackage(trackingNumber).catch(error => ({
                trackingNumber,
                status: 'exception',
                statusDescription: error.message,
                lastChecked: new Date().toISOString(),
                error: true
            }))
        );

        return Promise.all(trackingPromises);
    }

    /**
     * Parse tracking numbers from text input
     * @param {string} text - Text containing tracking numbers
     * @returns {Array} Array of detected tracking numbers
     */
    parseTrackingNumbers(text) {
        if (!text || text.trim() === '') {
            return [];
        }

        // Split by common delimiters and clean up
        const lines = text.split(/[\n\r,;]+/)
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const trackingNumbers = [];
        
        for (const line of lines) {
            // Try to extract tracking numbers from the line
            // Look for patterns that might be tracking numbers
            const possibleNumbers = line.split(/\s+/)
                .map(item => item.trim())
                .filter(item => item.length >= 8); // Minimum reasonable tracking number length

            for (const number of possibleNumbers) {
                // Clean the number
                const cleaned = number.replace(/[^\w]/g, '').toUpperCase();
                
                // Check if any carrier can handle it
                if (this.detectCarrier(cleaned)) {
                    trackingNumbers.push(cleaned);
                } else if (cleaned.length >= 10) {
                    // Add it anyway if it looks like it could be a tracking number
                    trackingNumbers.push(cleaned);
                }
            }
        }

        // Remove duplicates
        return [...new Set(trackingNumbers)];
    }

    /**
     * Get tracking statistics
     * @returns {Object} Statistics about carriers and tracking
     */
    getStats() {
        return {
            carriersCount: this.carriers.size,
            carriers: Array.from(this.carriers.keys()),
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Validate tracking number format
     * @param {string} trackingNumber - Tracking number to validate
     * @returns {Object} Validation result
     */
    validateTrackingNumber(trackingNumber) {
        if (!trackingNumber || trackingNumber.trim() === '') {
            return {
                valid: false,
                error: 'Tracking number is required'
            };
        }

        const cleaned = trackingNumber.replace(/\s+/g, '').toUpperCase();
        
        if (cleaned.length < 8) {
            return {
                valid: false,
                error: 'Tracking number too short'
            };
        }

        if (cleaned.length > 35) {
            return {
                valid: false,
                error: 'Tracking number too long'
            };
        }

        const carrier = this.detectCarrier(cleaned);
        
        return {
            valid: carrier !== null,
            carrier: carrier ? { name: carrier.name, code: carrier.code } : null,
            error: carrier ? null : 'Unknown tracking number format'
        };
    }
}

// Export the class and create global instance
window.TrackerRegistry = TrackerRegistry;
window.trackerRegistry = new TrackerRegistry();

// Add a function to retry initialization if carriers failed to load
window.retryCarrierInitialization = function() {
    if (window.trackerRegistry.carriers.size === 0) {
        console.log('Retrying carrier initialization...');
        window.trackerRegistry.initializeCarriers();
    }
};

// Try to re-initialize carriers after a delay to handle loading issues
setTimeout(() => {
    window.retryCarrierInitialization();
}, 500);

// Additional initialization attempts to ensure carriers are loaded
setTimeout(() => {
    if (window.trackerRegistry.carriers.size === 0) {
        console.log('Second retry of carrier initialization...');
        window.trackerRegistry.initializeCarriers();
    }
}, 1000);

// Final attempt after DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.retryCarrierInitialization();
        }, 100);
    });
} else {
    setTimeout(() => {
        window.retryCarrierInitialization();
    }, 100);
}

// Add debug function for testing carrier detection
window.testCarrierDetection = function(trackingNumber) {
    console.log(`Testing carrier detection for: ${trackingNumber}`);
    console.log(`Available carriers: ${window.trackerRegistry.carriers.size}`);
    console.log('Carrier list:', Array.from(window.trackerRegistry.carriers.keys()));
    
    const carrier = window.trackerRegistry.detectCarrier(trackingNumber);
    if (carrier) {
        console.log(`✓ Detected: ${carrier.name} (${carrier.code})`);
        console.log(`URL: ${carrier.getUrl(trackingNumber)}`);
    } else {
        console.log('✗ No carrier detected');
    }
    return carrier;
}; 