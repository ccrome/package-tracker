/**
 * Base carrier class that all carriers extend
 */
class BaseCarrier {
    constructor(name, code, urlTemplate, patterns) {
        this.name = name;
        this.code = code;
        this.urlTemplate = urlTemplate;
        this.patterns = patterns;
    }

    /**
     * Check if tracking number matches this carrier
     */
    matches(trackingNumber) {
        return this.patterns.some(pattern => pattern.test(trackingNumber));
    }

    /**
     * Get tracking URL for this carrier
     */
    getUrl(trackingNumber) {
        return this.urlTemplate.replace('{trackingNumber}', trackingNumber);
    }

    /**
     * Track package - tries backend first, falls back to unavailable
     */
    async track(trackingNumber) {
        // Try backend API first if available
        if (window.backendService && window.backendService.isAvailable) {
            try {
                const result = await window.backendService.trackPackage(trackingNumber, this.code);
                return result;
            } catch (error) {
                console.log(`Backend tracking failed for ${this.name}, falling back to unavailable mode:`, error);
                // Fall through to unavailable mode
            }
        }

        // Try any carrier-specific implementations
        try {
            const result = await this.trackDirect(trackingNumber);
            if (result) {
                return result;
            }
        } catch (error) {
            console.log(`Direct tracking failed for ${this.name}:`, error);
        }

        // Return unavailable status with link
        return {
            status: 'unavailable',
            message: `Click 'View on ${this.name}' below for official tracking information`,
            url: this.getUrl(trackingNumber),
            isReal: false,
            source: 'Link Only'
        };
    }

    /**
     * Direct tracking implementation (override in subclasses if needed)
     * This is for carriers that might have CORS-free endpoints or other direct methods
     */
    async trackDirect(trackingNumber) {
        // Default implementation returns null (no direct tracking)
        return null;
    }

    /**
     * Format tracking status for display
     */
    formatStatus(status) {
        const statusMap = {
            'in_transit': 'In Transit',
            'delivered': 'Delivered',
            'exception': 'Exception',
            'pending': 'Pending',
            'unavailable': 'Unavailable'
        };
        return statusMap[status] || status;
    }

    /**
     * Get status color for UI
     */
    getStatusColor(status) {
        const colorMap = {
            'delivered': 'var(--success-color)',
            'in_transit': 'var(--primary-color)',
            'exception': 'var(--error-color)',
            'pending': 'var(--warning-color)',
            'unavailable': 'var(--muted-color)'
        };
        return colorMap[status] || 'var(--text-color)';
    }

    /**
     * Parse date string into consistent format
     */
    parseDate(dateString) {
        if (!dateString) return null;
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return null;
        }
    }

    /**
     * Clean and normalize tracking number
     */
    cleanTrackingNumber(trackingNumber) {
        return trackingNumber.replace(/\s+/g, '').toUpperCase();
    }
}

// Export for use by other carrier files
window.BaseCarrier = BaseCarrier; 