/**
 * DHL Carrier implementation
 */
class DHLCarrier extends BaseCarrier {
    constructor() {
        super();
        this.name = 'DHL';
        this.code = 'dhl';
        this.color = '#FFD320';
        this.trackingUrlTemplate = 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id={trackingNumber}';
    }

    /**
     * Check if this carrier can handle the tracking number
     * DHL tracking numbers have various international formats
     */
    canHandle(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        // DHL patterns
        const patterns = [
            /^\d{10}$/,                    // 10 digits - DHL Express
            /^\d{11}$/,                    // 11 digits - DHL Express waybill
            /^[A-Z]{2}\d{9}[A-Z]{2}$/,     // Letter-digit-letter format
            /^JJD\d{17}$/,                 // DHL eCommerce
            /^GM\d{16}$/,                  // DHL Global Mail
            /^LX\d{9}[A-Z]{2}$/,           // DHL Parcel
            /^RX\d{9}[A-Z]{2}$/,           // DHL Parcel
            /^00\d{14}$/,                  // 16 digits starting with 00
            /^\d{12}$/,                    // 12 digits - DHL eCommerce
        ];
        
        return patterns.some(pattern => pattern.test(cleaned));
    }

    /**
     * Get tracking information from DHL
     * Note: This is a simplified implementation since DHL API requires authentication
     */
    async getTrackingInfo(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        try {
            // DHL API requires authentication and can't be accessed directly from browser
            return this.formatUnavailable('Click "View on DHL" below for official tracking information.');
            
        } catch (error) {
            console.error('DHL tracking error:', error);
            return this.formatUnavailable('Click "View on DHL" below for official tracking information.');
        }
    }



    /**
     * Determine DHL service type based on tracking number
     */
    getServiceType(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        if (cleaned.startsWith('JJD')) return 'DHL eCommerce';
        if (cleaned.startsWith('GM')) return 'DHL Global Mail';
        if (cleaned.startsWith('LX') || cleaned.startsWith('RX')) return 'DHL Parcel';
        if (cleaned.length === 10 || cleaned.length === 11) return 'DHL Express';
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(cleaned)) return 'DHL Express';
        
        return 'DHL';
    }

    /**
     * Check if tracking number is for international shipment
     */
    isInternational(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        // Most DHL shipments are international
        return /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(cleaned) || 
               cleaned.length === 10 || 
               cleaned.length === 11;
    }
}

// Register the carrier
window.DHLCarrier = DHLCarrier; 