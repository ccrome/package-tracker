/**
 * Base carrier class that all specific carriers extend
 */
class BaseCarrier {
    constructor() {
        this.name = 'Unknown';
        this.code = 'unknown';
        this.color = '#64748b';
        this.trackingUrlTemplate = '';
    }

    /**
     * Detect if this carrier handles the given tracking number
     * @param {string} trackingNumber - The tracking number to check
     * @returns {boolean} - True if this carrier handles this tracking number
     */
    canHandle(trackingNumber) {
        throw new Error('canHandle method must be implemented by carrier');
    }

    /**
     * Get tracking information for a package
     * @param {string} trackingNumber - The tracking number
     * @returns {Promise<Object>} - Tracking information object
     */
    async getTrackingInfo(trackingNumber) {
        throw new Error('getTrackingInfo method must be implemented by carrier');
    }

    /**
     * Generate tracking URL for the carrier's website
     * @param {string} trackingNumber - The tracking number
     * @returns {string} - URL to track the package on carrier's site
     */
    getTrackingUrl(trackingNumber) {
        return this.trackingUrlTemplate.replace('{trackingNumber}', encodeURIComponent(trackingNumber));
    }

    /**
     * Normalize status from carrier-specific status to standard status
     * @param {string} carrierStatus - Status from carrier API
     * @returns {string} - Normalized status (delivered, in-transit, exception, unknown)
     */
    normalizeStatus(carrierStatus) {
        const status = carrierStatus.toLowerCase();
        
        if (status.includes('delivered') || status.includes('delivered to') || status.includes('delivery complete')) {
            return 'delivered';
        }
        
        if (status.includes('in transit') || status.includes('on the way') || status.includes('shipped') || 
            status.includes('out for delivery') || status.includes('processing') || status.includes('dispatched')) {
            return 'in-transit';
        }
        
        if (status.includes('exception') || status.includes('delayed') || status.includes('failed') || 
            status.includes('returned') || status.includes('refused') || status.includes('undeliverable')) {
            return 'exception';
        }
        
        return 'unknown';
    }

    /**
     * Make HTTP request with CORS proxy if needed
     * @param {string} url - The URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} - Fetch response
     */
    async fetchWithCors(url, options = {}) {
        // First try direct request
        try {
            const response = await fetch(url, {
                ...options,
                mode: 'cors'
            });
            
            if (response.ok) {
                return response;
            }
        } catch (error) {
            console.log('Direct fetch failed, trying with CORS proxy:', error.message);
        }

        // If direct request fails, try with CORS proxy
        const corsProxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://cors-proxy.htmldriven.com/?url='
        ];

        for (const proxy of corsProxies) {
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                const response = await fetch(proxyUrl, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (response.ok) {
                    return response;
                }
            } catch (error) {
                console.log(`CORS proxy ${proxy} failed:`, error.message);
                continue;
            }
        }

        throw new Error('All CORS proxy attempts failed');
    }

    /**
     * Parse date string to ISO format
     * @param {string} dateString - Date string from carrier
     * @returns {string|null} - ISO date string or null
     */
    parseDate(dateString) {
        if (!dateString) return null;
        
        try {
            const date = new Date(dateString);
            return date.toISOString();
        } catch (error) {
            console.error('Error parsing date:', dateString, error);
            return null;
        }
    }

    /**
     * Clean tracking number by removing spaces and special characters
     * @param {string} trackingNumber - Raw tracking number
     * @returns {string} - Cleaned tracking number
     */
    cleanTrackingNumber(trackingNumber) {
        return trackingNumber.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }

    /**
     * Get carrier info object
     * @returns {Object} - Carrier information
     */
    getInfo() {
        return {
            name: this.name,
            code: this.code,
            color: this.color
        };
    }

    /**
     * Format unavailable data response
     * @param {string} message - Unavailable message
     * @returns {Object} - Formatted unavailable response
     */
    formatUnavailable(message) {
        return {
            status: 'unavailable',
            statusDescription: message,
            lastChecked: new Date().toISOString(),
            dataUnavailable: true
        };
    }

    /**
     * Format error response for actual errors
     * @param {string} message - Error message
     * @returns {Object} - Formatted error response
     */
    formatError(message) {
        return {
            status: 'unavailable',
            statusDescription: message,
            lastChecked: new Date().toISOString(),
            dataUnavailable: true
        };
    }

    /**
     * Format successful tracking response
     * @param {Object} data - Tracking data
     * @returns {Object} - Formatted tracking response
     */
    formatResponse(data) {
        return {
            status: this.normalizeStatus(data.status || 'unknown'),
            statusDescription: data.statusDescription || 'No tracking information available',
            lastChecked: new Date().toISOString(),
            deliveredDate: data.deliveredDate || null,
            estimatedDelivery: data.estimatedDelivery || null,
            location: data.location || null,
            trackingEvents: data.trackingEvents || [],
            error: false,
            ...data
        };
    }
}

// Export for use by other carrier files
window.BaseCarrier = BaseCarrier; 