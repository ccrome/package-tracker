/**
 * Package Tracker Backend Server
 * 
 * This server provides real tracking data when available.
 * Run with: node server.js
 * 
 * Environment variables:
 * - PORT: Server port (default: 3000)
 * - USPS_API_KEY: USPS API key (optional)
 * - UPS_API_KEY: UPS API key (optional)
 * - FEDEX_API_KEY: FedEx API key (optional)
 * - DHL_API_KEY: DHL API key (optional)
 */

/**
 * Package Tracker Server
 * 
 * ⚠️  IMPORTANT: USPS API MIGRATION REQUIRED
 * 
 * The USPS Web Tools API is being RETIRED on January 25, 2026.
 * This server currently uses mock data for USPS and needs to be updated
 * to use the new USPS APIs Developer Portal.
 * 
 * Migration checklist:
 * ✅ Updated documentation with migration notice
 * ❌ Implement OAuth2 authentication for new USPS API
 * ❌ Replace XML requests with REST/JSON calls
 * ❌ Update API endpoints to use api.usps.com
 * ❌ Test with real USPS API credentials
 * 
 * Current API Status:
 * - USPS: Demo/Mock data only (migration required)
 * - UPS: Not implemented (placeholder)
 * - FedEx: Not implemented (placeholder)  
 * - DHL: Not implemented (placeholder)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080; // Cloud Run uses PORT env var, default to 8080

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files from root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Routes

// Health check / ping endpoint
app.get('/api/track/ping', (req, res) => {
    res.json({ 
        available: true, 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get backend capabilities
app.get('/api/track/capabilities', (req, res) => {
    const capabilities = {
        carriers: [],
        features: ['basic_tracking']
    };

    // Check which carriers have API keys configured
    if (process.env.USPS_API_KEY) {
        capabilities.carriers.push('usps');
        capabilities.features.push('usps_real_time');
    }
    
    if (process.env.UPS_API_KEY) {
        capabilities.carriers.push('ups');
        capabilities.features.push('ups_real_time');
    }
    
    if (process.env.FEDEX_API_KEY) {
        capabilities.carriers.push('fedex');
        capabilities.features.push('fedex_real_time');
    }
    
    if (process.env.DHL_API_KEY) {
        capabilities.carriers.push('dhl');
        capabilities.features.push('dhl_real_time');
    }

    res.json(capabilities);
});

// Main tracking endpoint
app.post('/api/track', async (req, res) => {
    const { trackingNumber, carrier } = req.body;

    if (!trackingNumber || !carrier) {
        return res.status(400).json({
            success: false,
            error: 'trackingNumber and carrier are required'
        });
    }

    try {
        const trackingData = await getTrackingData(trackingNumber, carrier);
        
        if (trackingData) {
            res.json({
                success: true,
                data: trackingData
            });
        } else {
            res.json({
                success: false,
                error: 'No tracking data available'
            });
        }
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Get tracking data from appropriate carrier API
 */
async function getTrackingData(trackingNumber, carrier) {
    switch (carrier.toLowerCase()) {
        case 'usps':
            return await getUSPSTracking(trackingNumber);
        case 'ups':
            return await getUPSTracking(trackingNumber);
        case 'fedex':
            return await getFedExTracking(trackingNumber);
        case 'dhl':
            return await getDHLTracking(trackingNumber);
        default:
            throw new Error(`Unsupported carrier: ${carrier}`);
    }
}

/**
 * USPS tracking implementation
 * 
 * IMPORTANT: This implementation needs to be updated to use the new USPS APIs.
 * The old USPS Web Tools API is being retired on January 25, 2026.
 * 
 * Migration Required:
 * - Old: Web Tools API (XML-based, being retired)
 * - New: USPS APIs Developer Portal (REST-based, OAuth2)
 * 
 * To implement real USPS tracking:
 * 1. Register at: https://developer.usps.com/
 * 2. Use the new USPS Tracking API endpoints
 * 3. Implement OAuth2 authentication
 * 4. Use REST/JSON instead of XML
 * 
 * Current Status: Demo mode with mock data
 */
async function getUSPSTracking(trackingNumber) {
    if (!process.env.USPS_API_KEY) {
        console.log('USPS API key not configured');
        return null;
    }

    console.log(`Fetching USPS tracking for ${trackingNumber}`);
    
    // NOTE: This is still demo/mock data
    // Real implementation would use:
    // - Base URL: https://api.usps.com/
    // - Endpoint: /tracking/v3/tracking/{trackingNumber}
    // - Headers: Authorization: Bearer {oauth_token}
    // - Content-Type: application/json
    
    try {
        // TODO: Replace with actual USPS API calls when implementing
        // Example structure for new USPS API call:
        /*
        const response = await fetch(`https://api.usps.com/tracking/v3/tracking/${trackingNumber}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${await getUSPSOAuthToken()}`,
                'Content-Type': 'application/json',
                'X-User-Id': process.env.USPS_USER_ID
            }
        });
        
        if (!response.ok) {
            throw new Error(`USPS API error: ${response.status}`);
        }
        
        const data = await response.json();
        return parseUSPSResponse(data);
        */
        
        // Demo response structure (similar to what new API would return)
        return {
            status: 'in_transit',
            message: 'Package is in transit',
            lastUpdate: new Date().toISOString(),
            location: 'Distribution Center',
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            events: [
                {
                    date: new Date().toISOString(),
                    status: 'In Transit',
                    location: 'Distribution Center',
                    description: 'Package is on its way'
                }
            ],
            isReal: false, // Changed to false since this is mock data
            source: 'USPS API (Demo Mode - Requires Migration to New API)'
        };
    } catch (error) {
        console.error('USPS API error:', error);
        return null;
    }
}

/**
 * UPS tracking implementation
 */
async function getUPSTracking(trackingNumber) {
    if (!process.env.UPS_API_KEY) {
        console.log('UPS API key not configured');
        return null;
    }

    // TODO: Implement UPS API integration
    console.log(`Fetching UPS tracking for ${trackingNumber}`);
    return null;
}

/**
 * FedEx tracking implementation
 */
async function getFedExTracking(trackingNumber) {
    if (!process.env.FEDEX_API_KEY) {
        console.log('FedEx API key not configured');
        return null;
    }

    // TODO: Implement FedEx API integration
    console.log(`Fetching FedEx tracking for ${trackingNumber}`);
    return null;
}

/**
 * DHL tracking implementation
 */
async function getDHLTracking(trackingNumber) {
    if (!process.env.DHL_API_KEY) {
        console.log('DHL API key not configured');
        return null;
    }

    // TODO: Implement DHL API integration
    console.log(`Fetching DHL tracking for ${trackingNumber}`);
    return null;
}

// Start server
app.listen(PORT, () => {
    console.log(`Package Tracker Server running on http://localhost:${PORT}`);
    console.log(`Mode: Server (Backend Available)`);
    console.log('');
    console.log('⚠️  IMPORTANT: USPS API MIGRATION REQUIRED');
    console.log('   USPS Web Tools API retires January 25, 2026');
    console.log('   Must migrate to: https://developer.usps.com/');
    console.log('');
    
    // Show configured carriers
    const configuredCarriers = [];
    if (process.env.USPS_API_KEY) configuredCarriers.push('USPS (Demo/Mock data - migration required)');
    if (process.env.UPS_API_KEY) configuredCarriers.push('UPS');
    if (process.env.FEDEX_API_KEY) configuredCarriers.push('FedEx');
    if (process.env.DHL_API_KEY) configuredCarriers.push('DHL');
    
    if (configuredCarriers.length > 0) {
        console.log(`Configured carriers: ${configuredCarriers.join(', ')}`);
    } else {
        console.log('No carrier API keys configured - running in demo mode');
    }
});

module.exports = app; 