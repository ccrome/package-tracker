/**
 * USPS Carrier implementation
 */
class USPSCarrier extends BaseCarrier {
    constructor() {
        super();
        this.name = 'USPS';
        this.code = 'usps';
        this.color = '#004B87';
        this.trackingUrlTemplate = 'https://tools.usps.com/go/TrackConfirmAction?tLabels={trackingNumber}';
    }

    /**
     * Check if this carrier can handle the tracking number
     * USPS tracking numbers have various formats:
     * - 20-22 digits: Priority Mail Express, Priority Mail, etc.
     * - 13 digits starting with specific prefixes
     * - Various other patterns
     */
    canHandle(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        // Common USPS patterns
        const patterns = [
            /^9[0-5]\d{20}$/,              // 22 digits starting with 90-95 (most common)
            /^(EA|EC|ED|EE|EH|EI|EJ|EK|EL|EM|EN|EP|ER|ES|ET|EV|EW|EX|EY|EZ)\d{9}US$/,  // Express Mail
            /^(RA|RB|RC|RD|RE|RF|RG|RH|RI|RJ|RK|RL|RM|RN|RP|RQ|RR|RS|RT|RU|RV|RW|RX|RY|RZ)\d{9}US$/,  // Registered Mail
            /^(LA|LB|LC|LD|LE|LF|LG|LH|LI|LJ|LK|LL|LM|LN|LP|LQ|LR|LS|LT|LU|LV|LW|LX|LY|LZ)\d{9}US$/,  // Priority Mail Express International
            /^(CA|CB|CC|CD|CE|CF|CG|CH|CI|CJ|CK|CL|CM|CN|CP|CQ|CR|CS|CT|CU|CV|CW|CX|CY|CZ)\d{9}US$/,  // Priority Mail International
            /^82\d{8}$/,                   // 10 digits starting with 82
            /^(420\d{5})?9[0-5]\d{20}$/,   // IMI (International Mail Item)
        ];

        
        return patterns.some(pattern => pattern.test(cleaned));
    }

    /**
     * Get tracking information from USPS
     * Attempts to fetch real data using various methods
     */
    async getTrackingInfo(trackingNumber) {
        const cleaned = this.cleanTrackingNumber(trackingNumber);
        
        try {
            // Try to get real USPS data using available methods
            const realData = await this.fetchRealTrackingData(cleaned);
            if (realData) {
                return realData;
            }
            
                                     // No real data available
            return this.formatUnavailable('Click "View on USPS" below for official tracking information.');
            
        } catch (error) {
            console.error('USPS tracking error:', error);
            return this.formatUnavailable('Click "View on USPS" below for official tracking information.');
        }
    }

    /**
     * Attempt to fetch real USPS tracking data
     */
    async fetchRealTrackingData(trackingNumber) {
        // Method 1: Try USPS Tracking API (requires CORS proxy)
        try {
            const uspsUrl = `https://tools.usps.com/go/TrackConfirmAction.action?tLabels=${trackingNumber}`;
            console.log('USPS: Attempting to fetch real data from:', uspsUrl);
            
            const response = await this.fetchWithCors(uspsUrl);
            if (response && response.ok) {
                const html = await response.text();
                return this.parseUSPSHTML(html, trackingNumber);
            }
        } catch (error) {
            console.log('USPS: Direct/CORS proxy method failed:', error.message);
        }

                 // Method 2: Try free tracking services
         try {
             // Try 17track free API (no API key required for some endpoints)
             const seventeenTrackUrl = `https://api.17track.net/track/v1/trackinfo`;
             const response = await fetch(seventeenTrackUrl, {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify([{
                     number: trackingNumber,
                     carrier: 226 // USPS carrier code for 17track
                 }])
             });
             
             if (response.ok) {
                 const data = await response.json();
                 return this.parse17TrackResponse(data, trackingNumber);
             }
         } catch (error) {
             console.log('USPS: 17track method failed:', error.message);
         }

         // Method 3: Try other free tracking APIs
         try {
             // Try track24.net API (often allows CORS)
             const track24Url = `https://api.track24.net/${trackingNumber}`;
             const response = await fetch(track24Url);
             if (response.ok) {
                 const data = await response.json();
                 return this.parseTrack24Response(data);
             }
         } catch (error) {
             console.log('USPS: track24 method failed:', error.message);
         }

        return null; // No real data available
    }

    /**
     * Parse USPS HTML response to extract tracking information
     */
    parseUSPSHTML(html, trackingNumber) {
        try {
            // This is a simplified parser - USPS HTML structure may change
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Look for tracking information in the HTML
            const statusElement = doc.querySelector('.delivery_status, .tracking-summary');
            const locationElement = doc.querySelector('.tracking-location, .location');
            const dateElement = doc.querySelector('.tracking-date, .date');
            
            if (statusElement) {
                const status = statusElement.textContent.trim();
                const location = locationElement ? locationElement.textContent.trim() : '';
                const date = dateElement ? dateElement.textContent.trim() : '';
                
                return this.formatResponse({
                    status: status,
                    statusDescription: status,
                    location: location,
                    lastUpdate: date,
                    source: 'USPS Website'
                });
            }
            
        } catch (error) {
            console.error('Error parsing USPS HTML:', error);
        }
        
        return null;
    }

    /**
     * Parse 17track API response
     */
    parse17TrackResponse(data, trackingNumber) {
        try {
            if (data && data.data && data.data.accepted && data.data.accepted.length > 0) {
                const trackInfo = data.data.accepted[0];
                if (trackInfo.track && trackInfo.track.length > 0) {
                    const track = trackInfo.track[0];
                    return this.formatResponse({
                        status: track.c || 'unknown',
                        statusDescription: track.z || 'No description available',
                        location: track.a || '',
                        deliveredDate: track.c === 40 ? track.z : null, // 40 = delivered status
                        source: '17track API',
                        isReal: true
                    });
                }
            }
        } catch (error) {
            console.error('Error parsing 17track response:', error);
        }
        return null;
    }

    /**
     * Parse track24 API response
     */
    parseTrack24Response(data) {
        try {
            if (data && data.status && data.events) {
                const latestEvent = data.events[0];
                return this.formatResponse({
                    status: data.status,
                    statusDescription: latestEvent?.description || data.status,
                    location: latestEvent?.location || '',
                    deliveredDate: data.status.toLowerCase().includes('delivered') ? latestEvent?.date : null,
                    trackingEvents: data.events.map(event => ({
                        date: event.date,
                        status: event.description,
                        location: event.location
                    })),
                    source: 'Track24 API',
                    isReal: true
                });
            }
        } catch (error) {
            console.error('Error parsing track24 response:', error);
        }
        return null;
    }


}

// Register the carrier
window.USPSCarrier = USPSCarrier; 