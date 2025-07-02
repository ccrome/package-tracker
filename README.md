# Package Tracker

A client-side web application for tracking packages from multiple carriers (USPS, UPS, FedEx, DHL) in one convenient interface.

## Features

- **Multi-Carrier Support**: Track packages from USPS, UPS, FedEx, and DHL
- **Automatic Carrier Detection**: Automatically detects which carrier to use based on tracking number format
- **Local Storage**: All data is stored locally in your browser - no server required
- **Real-time Updates**: Refresh tracking information with a single click
- **Smart Completion**: Packages are automatically marked as completed one week after delivery
- **Clean Interface**: Modern, responsive design that works on desktop and mobile
- **Batch Input**: Add multiple tracking numbers at once

## How to Use

1. **Open the Application**: Simply open `index.html` in your web browser
2. **Add Tracking Numbers**: Paste one or more tracking numbers in the text area (one per line)
3. **Automatic Tracking**: The app will automatically detect the carrier and fetch tracking information
4. **View Updates**: Click "Refresh All" to update all packages, or refresh individual packages
5. **Manage Packages**: Remove packages you no longer want to track

## Supported Carriers

### USPS (United States Postal Service)
- Priority Mail Express
- Priority Mail
- Ground Advantage
- Various other USPS services
- Supports tracking numbers: 22 digits starting with 94/93/92/95, Express Mail format, etc.

### UPS (United Parcel Service)
- UPS Ground, Air, Express
- Supports tracking numbers: 1Z followed by 16 characters, and other UPS formats

### FedEx
- FedEx Express, Ground, SmartPost
- Supports tracking numbers: 12-22 digits in various FedEx formats

### DHL
- DHL Express, eCommerce, International
- Supports tracking numbers: 10-11 digits, letter-digit-letter format, and other DHL formats

## Technical Architecture

### Modular Design
The application uses a modular architecture where each carrier is implemented as a separate class:

- `BaseCarrier`: Abstract base class that all carriers extend
- `USPSCarrier`, `UPSCarrier`, `FedExCarrier`, `DHLCarrier`: Specific implementations
- `TrackerRegistry`: Manages all carriers and provides unified interface
- `StorageManager`: Handles local data storage and management
- `PackageTrackerApp`: Main application logic and UI management

### Files Structure
```
├── index.html              # Main HTML file
├── style.css               # Styling and responsive design
├── js/
│   ├── storage.js          # Local storage management
│   ├── trackerRegistry.js  # Carrier registry and management
│   ├── app.js              # Main application logic
│   └── carriers/
│       ├── base.js         # Base carrier class
│       ├── usps.js         # USPS implementation
│       ├── ups.js          # UPS implementation
│       ├── fedex.js        # FedEx implementation
│       └── dhl.js          # DHL implementation
```

## Adding New Carriers

To add support for a new carrier:

1. Create a new file in `js/carriers/` (e.g., `newcarrier.js`)
2. Extend the `BaseCarrier` class
3. Implement required methods:
   - `canHandle(trackingNumber)`: Detection logic
   - `getTrackingInfo(trackingNumber)`: Tracking API integration
4. Register the carrier in `trackerRegistry.js`
5. Add the script tag to `index.html`

Example:
```javascript
class NewCarrier extends BaseCarrier {
    constructor() {
        super();
        this.name = 'New Carrier';
        this.code = 'newcarrier';
        this.color = '#FF6B6B';
        this.trackingUrlTemplate = 'https://newcarrier.com/track/{trackingNumber}';
    }

    canHandle(trackingNumber) {
        // Implement detection logic
        return /^NC\d{10}$/.test(trackingNumber);
    }

    async getTrackingInfo(trackingNumber) {
        // Implement API integration
        // Return formatted tracking data
    }
}
```

## Data Storage

All data is stored locally in your browser using `localStorage`:

- **Packages**: Tracking numbers, status, history
- **Settings**: User preferences (show completed packages, etc.)
- **No Server Required**: Everything runs in your browser

## Package Lifecycle

1. **Added**: Package is added to tracking list
2. **Tracking**: Regular status updates from carrier APIs
3. **Delivered**: Package is marked as delivered
4. **Completed**: Automatically marked as completed one week after delivery
5. **Cleanup**: Old completed packages (3+ months) are automatically removed

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **JavaScript ES6+**: Uses modern JavaScript features
- **Local Storage**: Requires browser with localStorage support
- **Fetch API**: Uses fetch for HTTP requests

## Limitations & Notes

- **Real Data Only**: No fake or mock data is displayed. Packages will show error messages when real tracking data is unavailable
- **API Authentication**: Most carriers (UPS, FedEx, DHL) require API keys and can't be accessed directly from browser
- **CORS Restrictions**: Direct API calls are blocked by CORS policies. The code includes CORS proxy attempts for USPS
- **Official Links**: All packages provide direct links to official carrier tracking pages
- **Production Use**: For real implementations, you would need server-side integration with carrier APIs

## Development

To customize or extend the application:

1. **Local Development**: Simply open `index.html` in a browser
2. **No Build Process**: Pure vanilla JavaScript - no compilation needed
3. **Live Reload**: Use a local server for auto-refresh during development
4. **Browser DevTools**: Use browser console to debug and test

## Privacy & Security

- **No Server**: All data stays in your browser
- **No Tracking**: No analytics or external tracking
- **Local Only**: Package information never leaves your device
- **No Account Required**: No sign-up or login needed

## Contributing

This is a demonstration project showing how to build a modular package tracking system. Feel free to:

- Add new carriers
- Improve the UI/UX
- Add real API integrations
- Enhance error handling
- Add more features

## License

This project is for educational and demonstration purposes. Check carrier API terms of service before implementing real integrations. 