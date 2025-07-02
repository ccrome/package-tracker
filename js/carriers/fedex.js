/**
 * FedEx Carrier implementation
 */
class FedExCarrier extends BaseCarrier {
    constructor() {
        super();
        this.name = 'FedEx';
        this.code = 'fedex';
        this.color = '#4d148c';
        this.trackingUrlTemplate = 'https://www.fedex.com/fedextrack/?trknbr={trackingNumber}';
    }

    /**
     * Check if this carrier can handle the tracking number
     * FedEx tracking numbers have various formats
     */
    canHandle(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        // FedEx patterns
        const patterns = [
            /^\d{12}$/,                    // 12 digits - FedEx Express
            /^\d{14}$/,                    // 14 digits - FedEx Express
            /^\d{15}$/,                    // 15 digits - FedEx Ground
            /^\d{20}$/,                    // 20 digits - FedEx SmartPost
            /^(?!9[0-5])\d{22}$/,          // 22 digits - FedEx Ground (but not starting with 90-95 which are USPS)
            /^96\d{18}$/,                  // 20 digits starting with 96
            /^[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}$/, // 12 digits with optional spaces
            /^61\d{18}$/,                  // 20 digits starting with 61
        ];
        
        return patterns.some(pattern => pattern.test(cleaned));
    }

    /**
     * Get tracking information from FedEx
     * Note: This is a simplified implementation since FedEx API requires authentication
     */
    async getTrackingInfo(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        try {
            // FedEx API requires authentication and can't be accessed directly from browser
            return this.formatUnavailable('Click "View on FedEx" below for official tracking information.');
            
        } catch (error) {
            console.error('FedEx tracking error:', error);
            return this.formatUnavailable('Click "View on FedEx" below for official tracking information.');
        }
    }



    /**
     * Determine FedEx service type based on tracking number
     */
    getServiceType(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        if (cleaned.length === 12) return 'FedEx Express';
        if (cleaned.length === 14) return 'FedEx Express';
        if (cleaned.length === 15) return 'FedEx Ground';
        if (cleaned.length === 20 && cleaned.startsWith('96')) return 'FedEx SmartPost';
        if (cleaned.length === 22) return 'FedEx Ground';
        
        return 'FedEx';
    }
}

// Register the carrier
window.FedExCarrier = FedExCarrier; 