# Package Tracker

A JavaScript application that tracks package status from multiple carriers (USPS, UPS, FedEx, DHL) designed to work as both a standalone web page and as a client-server application.

## 🚨 Important API Migration Notice

**USPS API Change Required**: The USPS Web Tools API is being **retired on January 25, 2026**. This application needs to be updated to use the new USPS APIs.

### Migration Details:
- **Old API**: USPS Web Tools (XML-based) - Being retired 
- **New API**: [USPS APIs Developer Portal](https://developer.usps.com/) (REST-based, OAuth2)
- **Timeline**: Must migrate before January 25, 2026
- **Current Status**: Demo mode only

## Features

- **Dual Mode Operation**: Works as standalone link manager or enhanced server-based tracker
- **Multi-Carrier Support**: USPS, UPS, FedEx, DHL
- **Smart Detection**: Automatically detects carrier from tracking number patterns
- **Local Storage**: Persists packages and settings in browser
- **Auto-Completion**: Marks packages as completed 1 week after delivery
- **Auto-Cleanup**: Removes old packages after 3 months
- **Batch Input**: Add multiple tracking numbers at once
- **Modern UI**: Responsive design with clean interface

## 🔗 **Standalone Mode** (Default)
- Works as a simple web page - no server required
- Opens directly in your browser from file system
- Provides smart link management to carrier websites
- Automatic carrier detection based on tracking numbers
- Local storage for package management

## 🟢 **Server Mode** (Enhanced)
- Provides real-time tracking data when backend is available
- Supports actual API integration with carriers
- Enhanced tracking capabilities and status updates

---

## Quick Start

### 🚀 Google Cloud Run Deployment (Recommended for Production)

Deploy to Google Cloud Run for a production-ready, serverless deployment:

```bash
# Quick deploy to Cloud Run
./deploy.sh your-project-id us-central1 --direct

# Set up API credentials (optional)
./setup-secrets.sh your-project-id
```

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete deployment guide.

### Standalone Mode (No Installation)
1. Download or clone this repository
2. Open `index.html` in your browser
3. Start adding tracking numbers!

### Server Mode (Enhanced Features)
1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000 in your browser

4. (Optional) Configure carrier API keys for real tracking:
   ```bash
   export USPS_API_KEY="your-usps-key"
   export UPS_API_KEY="your-ups-key"
   export FEDEX_API_KEY="your-fedex-key"
   export DHL_API_KEY="your-dhl-key"
   npm start
   ```

## Features

### Core Features (Both Modes)
- ✅ **Automatic Carrier Detection** - Recognizes USPS, UPS, FedEx, DHL tracking numbers
- ✅ **Smart Link Management** - Direct links to official carrier tracking pages
- ✅ **Local Storage** - Your packages are saved locally
- ✅ **Batch Import** - Add multiple tracking numbers at once
- ✅ **Package Management** - Auto-completion, cleanup, show/hide completed
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **No Registration Required** - Privacy-focused design

### Server Mode Additional Features
- 🚀 **Real-Time Tracking** - Live status updates from carrier APIs
- 🚀 **Enhanced Status Information** - Detailed delivery information
- 🚀 **Automatic Refresh** - Background status updates
- 🚀 **API Integration** - Direct carrier API connections

## Supported Carriers

| Carrier | Standalone Mode | Server Mode | Example Tracking Number |
|---------|----------------|-------------|------------------------|
| **USPS** | ✅ Links | 🚀 Real-time* | 9400136106193369031407 |
| **UPS** | ✅ Links | 🚀 Real-time* | 1Z12345E0205271688 |
| **FedEx** | ✅ Links | 🚀 Real-time* | 1234567890123456 |
| **DHL** | ✅ Links | 🚀 Real-time* | 1234567890 |

*Real-time tracking requires API keys

## Mode Detection

The application automatically detects which mode it's running in:

- **🔗 Link Mode**: Shows when no backend server is detected
- **🟢 Server Mode**: Shows when backend APIs are available

## File Structure

```
package-tracker/
├── index.html              # Main application page
├── style.css              # Application styles
├── js/
│   ├── app.js             # Main application logic
│   ├── backend.js         # Backend service detection
│   ├── storage.js         # Local storage management
│   ├── trackerRegistry.js # Carrier registry
│   └── carriers/          # Carrier implementations
│       ├── base.js        # Base carrier class
│       ├── usps.js        # USPS carrier
│       ├── ups.js         # UPS carrier
│       ├── fedex.js       # FedEx carrier
│       └── dhl.js         # DHL carrier
├── server.js              # Node.js backend server
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## Usage

### Adding Packages
1. Paste tracking numbers in the text area (one per line)
2. Click "Add Packages" - carrier detection is automatic
3. Packages appear in your tracking list

### Managing Packages
- **Refresh All**: Update all package statuses
- **Show/Hide Completed**: Toggle display of delivered packages
- **Individual Actions**: Refresh, view on carrier site, or remove packages
- **Clear All Data**: Remove all stored packages and settings

### Package Status
- **Delivered** ✅ - Package has been delivered
- **In Transit** 🚚 - Package is on its way
- **Exception** ⚠️ - Delivery issue or delay
- **Pending** ⏳ - Processing or awaiting pickup
- **Unavailable** 🔗 - Link to carrier website (standalone mode)

## API Configuration

### USPS (⚠️ Migration Required)

**Current Status**: Demo mode only - requires migration to new API

**Steps to get real USPS tracking**:
1. Register at [USPS APIs Developer Portal](https://developer.usps.com/)
2. Set up OAuth2 authentication
3. Update implementation to use REST endpoints
4. Set environment variable: `USPS_API_KEY=your_oauth_token`

**New API Information**:
- Base URL: `https://api.usps.com/`
- Tracking Endpoint: `/tracking/v3/tracking/{trackingNumber}`
- Authentication: OAuth2 Bearer token
- Format: REST/JSON (not XML)

### UPS

**API Information**:
- Developer Portal: [UPS Developer Kit](https://developer.ups.com/)
- Tracking API: UPS Tracking API
- Authentication: OAuth 2.0
- Set environment variable: `UPS_API_KEY=your_api_key`

### FedEx

**API Information**:
- Developer Portal: [FedEx Developer Portal](https://developer.fedex.com/)
- Tracking API: FedEx Track API
- Authentication: OAuth 2.0
- Set environment variable: `FEDEX_API_KEY=your_api_key`

### DHL

**API Information**:
- Developer Portal: [DHL Developer Portal](https://developer.dhl.com/)
- Tracking API: DHL Shipment Tracking API
- Authentication: API Key
- Set environment variable: `DHL_API_KEY=your_api_key`

## Real API Implementation

To implement real tracking APIs, you'll need to:

1. **Register with each carrier's developer portal**
2. **Obtain API credentials**
3. **Implement OAuth2 flows** (USPS, UPS, FedEx)
4. **Update the carrier implementations** in `/js/carriers/` and `server.js`
5. **Handle rate limits and error cases**
6. **Set up proper environment variables**

### Example Environment Setup:
```bash
# USPS (New API - OAuth2)
USPS_API_KEY=your_oauth_token
USPS_CLIENT_ID=your_client_id
USPS_CLIENT_SECRET=your_client_secret

# UPS (OAuth2)
UPS_API_KEY=your_api_key
UPS_CLIENT_ID=your_client_id
UPS_CLIENT_SECRET=your_client_secret

# FedEx (OAuth2)
FEDEX_API_KEY=your_api_key
FEDEX_CLIENT_ID=your_client_id
FEDEX_CLIENT_SECRET=your_client_secret

# DHL (API Key)
DHL_API_KEY=your_api_key
```

## Server Mode API Endpoints

When running in server mode, the following endpoints are available:

- `GET /api/track/ping` - Health check
- `GET /api/track/capabilities` - Get available carriers and features  
- `POST /api/track` - Track a package

### Example API Usage:

```bash
# Health check
curl http://localhost:3000/api/track/ping

# Get capabilities
curl http://localhost:3000/api/track/capabilities

# Track a package
curl -X POST http://localhost:3000/api/track \
  -H "Content-Type: application/json" \
  -d '{"trackingNumber": "9400136106193369031407", "carrier": "usps"}'
```

## Privacy & Data

- **Local Storage Only**: All package data is stored locally in your browser
- **No External Tracking**: We don't track your usage or packages
- **Direct Carrier Links**: Links go directly to official carrier websites
- **API Keys**: When using server mode, API keys are stored as environment variables

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in both standalone and server modes
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### v1.0.0
- ✅ Dual-mode operation (standalone/server)
- ✅ Automatic carrier detection
- ✅ Smart link management
- ✅ Local storage persistence
- ✅ Mobile responsive design
- ✅ Backend API framework for real tracking 