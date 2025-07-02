# Package Tracker - Web Frontend

This directory contains the static web files for the Package Tracker application.

## Files

- `index.html` - Main application page
- `style.css` - Application styles and responsive design
- `js/` - JavaScript modules and application logic
  - `app.js` - Main application class
  - `storage.js` - Local storage management with caching
  - `trackerRegistry.js` - Carrier detection and tracking coordination
  - `carriers/` - Individual carrier implementations
    - `base.js` - Base carrier class
    - `usps.js` - USPS carrier
    - `ups.js` - UPS carrier
    - `fedex.js` - FedEx carrier
    - `dhl.js` - DHL carrier

## Deployment

This directory is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the main branch.

## Local Development

You can serve this directory locally using any static file server:

```bash
# Using Python
cd docs && python -m http.server 8000

# Using Node.js (if you have http-server installed)
cd docs && npx http-server

# Using PHP
cd docs && php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

## Features

- **Carrier Detection**: Automatically detects USPS, UPS, FedEx, and DHL tracking numbers
- **Local Storage**: Minimal storage with smart caching and automatic migration
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Notes System**: Add and edit notes for each package with auto-save
- **Completion Tracking**: Manual completion control with archive functionality
- **Bulk Operations**: Add multiple tracking numbers and open all packages in new tabs 