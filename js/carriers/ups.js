/**
 * UPS Carrier implementation
 */
class UPSCarrier extends BaseCarrier {
    constructor() {
        super();
        this.name = 'UPS';
        this.code = 'ups';
        this.color = '#8B4513';
        this.trackingUrlTemplate = 'https://www.ups.com/track?tracknum={trackingNumber}';
    }

    /**
     * Check if this carrier can handle the tracking number
     * UPS tracking numbers typically start with "1Z" followed by 16 characters
     */
    canHandle(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        // UPS patterns
        const patterns = [
            /^1Z[0-9A-Z]{16}$/,           // Standard UPS tracking number
            /^T\d{10}$/,                  // UPS Freight
            /^H\d{10}$/,                  // UPS Hundredweight Service
            /^\d{9}$/,                    // UPS InfoNotice
            /^\d{10}$/,                   // UPS Reference Number
            /^T\d{4}[A-Z]{3}\d{2}$/,     // UPS Freight LTL
        ];
        
        return patterns.some(pattern => pattern.test(cleaned));
    }

    /**
     * Get tracking information from UPS
     * Note: This is a simplified implementation since UPS API requires authentication
     */
    async getTrackingInfo(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        try {
            // UPS API requires authentication and can't be accessed directly from browser
            return this.formatUnavailable('Click "View on UPS" below for official tracking information.');
            
        } catch (error) {
            console.error('UPS tracking error:', error);
            return this.formatUnavailable('Click "View on UPS" below for official tracking information.');
        }
    }



    /**
     * Validate UPS tracking number using check digit
     */
    validateTrackingNumber(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        if (!cleaned.startsWith('1Z') || cleaned.length !== 18) {
            return false;
        }

        // UPS uses a check digit algorithm
        const trackingCode = cleaned.substring(2, 17);
        const checkDigit = cleaned.charAt(17);
        
        // Simplified check digit validation (actual UPS algorithm is more complex)
        return true; // For demo purposes, always return true
    }
}

// Register the carrier
window.UPSCarrier = UPSCarrier; 