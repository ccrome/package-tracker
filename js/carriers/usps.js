/**
 * USPS Carrier Implementation
 * 
 * ⚠️ IMPORTANT: USPS Web Tools API is being retired January 25, 2026
 * This implementation needs to be updated to use the new USPS APIs:
 * - New API: https://developer.usps.com/
 * - Authentication: OAuth2 (not API key)
 * - Format: REST/JSON (not XML)
 * - Current status: Frontend falls back to unavailable/link mode
 */
class USPSCarrier extends BaseCarrier {
    constructor() {
        super(
            'USPS',
            'usps',
            'https://tools.usps.com/go/TrackConfirmAction?tLabels={trackingNumber}',
            [
                // Priority Mail Express patterns
                /^E[A-Z]{1}\d{9}[A-Z]{2}$/,
                /^9[0-5]\d{20}$/,
                
                // Priority Mail and other services
                /^9[0-4]\d{20}$/,
                /^82\d{8}$/,
                /^91\d{20}$/,
                
                // Common USPS patterns
                /^(94|93|92|90|91)\d{20}$/,
                /^[A-Z]{2}\d{9}[A-Z]{2}$/
            ]
        );
    }

    /**
     * Override direct tracking to attempt USPS API calls
     */
    async trackDirect(trackingNumber) {
        // Try free tracking APIs that might work
        const trackingAPIs = [
            {
                name: 'USPS Tracking API (Free)',
                url: `https://api.usps.com/tracking/v3/tracking/${trackingNumber}`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }
        ];

        for (const api of trackingAPIs) {
            try {
                const response = await fetch(api.url, {
                    method: 'GET',
                    headers: api.headers,
                    mode: 'cors'
                });

                if (response.ok) {
                    const data = await response.json();
                    return this.parseUSPSResponse(data);
                }
            } catch (error) {
                console.log(`USPS API ${api.name} failed:`, error);
                continue;
            }
        }

        // If all APIs fail, return null to fall back to unavailable
        return null;
    }

    /**
     * Parse USPS API response
     */
    parseUSPSResponse(data) {
        if (!data || !data.status) {
            return null;
        }

        const status = this.normalizeUSPSStatus(data.status);
        
        return {
            status: status,
            message: data.statusSummary || data.status,
            lastUpdate: data.eventDate ? this.parseDate(data.eventDate) : null,
            location: data.eventCity ? `${data.eventCity}, ${data.eventState || ''}` : null,
            events: data.events || [],
            deliveredDate: status === 'delivered' ? (data.deliveredDate || data.eventDate) : null,
            isReal: true,
            source: 'USPS API'
        };
    }

    /**
     * Normalize USPS status to standard format
     */
    normalizeUSPSStatus(status) {
        const statusLower = status.toLowerCase();
        
        if (statusLower.includes('delivered')) {
            return 'delivered';
        }
        if (statusLower.includes('out for delivery') || statusLower.includes('in transit') || 
            statusLower.includes('processing') || statusLower.includes('shipped')) {
            return 'in_transit';
        }
        if (statusLower.includes('exception') || statusLower.includes('delayed') || 
            statusLower.includes('undeliverable')) {
            return 'exception';
        }
        
        return 'pending';
    }
}

// Register the carrier
window.USPSCarrier = USPSCarrier; 