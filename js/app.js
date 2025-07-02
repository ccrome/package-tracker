/**
 * Main Application Logic
 */
class PackageTrackerApp {
    constructor() {
        this.loadingElement = document.getElementById('loadingIndicator');
        this.packagesContainer = document.getElementById('packagesContainer');
        this.emptyState = document.getElementById('emptyState');
        this.trackingInput = document.getElementById('trackingInput');
        this.addPackagesBtn = document.getElementById('addPackages');
        this.refreshAllBtn = document.getElementById('refreshAll');
        this.showCompletedCheckbox = document.getElementById('showCompleted');
        this.clearAllDataBtn = document.getElementById('clearAllData');
        
        this.settings = storageManager.getSettings();
        this.isLoading = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.loadSettings();
        this.renderPackages();
        this.cleanupOldPackages();
        
        console.log('Package Tracker App initialized');
        console.log('Tracker Registry Stats:', trackerRegistry.getStats());
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add packages button
        this.addPackagesBtn.addEventListener('click', () => this.handleAddPackages());
        
        // Refresh all button
        this.refreshAllBtn.addEventListener('click', () => this.handleRefreshAll());
        
        // Clear all data button
        this.clearAllDataBtn.addEventListener('click', () => this.handleClearAllData());
        
        // Show completed checkbox
        this.showCompletedCheckbox.addEventListener('change', (e) => {
            this.settings.showCompleted = e.target.checked;
            storageManager.saveSettings(this.settings);
            this.renderPackages();
        });
        
        // Enter key in textarea
        this.trackingInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.handleAddPackages();
            }
        });
        
        // Auto-save draft input
        this.trackingInput.addEventListener('input', () => {
            // Optional: Save draft to localStorage for recovery
        });
    }

    /**
     * Load user settings
     */
    loadSettings() {
        this.showCompletedCheckbox.checked = this.settings.showCompleted;
    }

    /**
     * Handle adding new packages
     */
    async handleAddPackages() {
        const inputText = this.trackingInput.value.trim();
        
        if (!inputText) {
            this.showError('Please enter tracking numbers');
            return;
        }

        // Parse tracking numbers from input
        const trackingNumbers = trackerRegistry.parseTrackingNumbers(inputText);
        
        if (trackingNumbers.length === 0) {
            this.showError('No valid tracking numbers found');
            return;
        }

        // Check for duplicates
        const existingPackages = storageManager.getPackages();
        const newTrackingNumbers = trackingNumbers.filter(trackingNumber => 
            !existingPackages.some(pkg => pkg.trackingNumber === trackingNumber)
        );

        if (newTrackingNumbers.length === 0) {
            this.showError('All tracking numbers are already being tracked');
            return;
        }

        // Add packages to storage first (so they appear immediately)
        const newPackages = [];
        for (const trackingNumber of newTrackingNumbers) {
            const carrier = trackerRegistry.detectCarrier(trackingNumber);
            const packageData = {
                trackingNumber,
                carrier: carrier ? carrier.code : 'unknown',
                trackingUrl: carrier ? carrier.getTrackingUrl(trackingNumber) : ''
            };
            
            const newPackage = storageManager.addPackage(packageData);
            newPackages.push(newPackage);
        }

        // Clear input and re-render
        this.trackingInput.value = '';
        this.renderPackages();

        // Show success message
        this.showSuccess(`Added ${newPackages.length} package${newPackages.length > 1 ? 's' : ''} for tracking`);

        // Track packages in background
        this.trackPackagesInBackground(newPackages.map(pkg => pkg.id));
    }

    /**
     * Handle refreshing all packages
     */
    async handleRefreshAll() {
        const packages = storageManager.getPackages();
        const activePackages = packages.filter(pkg => !pkg.isCompleted);
        
        if (activePackages.length === 0) {
            this.showError('No active packages to refresh');
            return;
        }

        await this.trackPackagesInBackground(activePackages.map(pkg => pkg.id));
    }

    /**
     * Handle clearing all data
     */
    handleClearAllData() {
        const confirmation = confirm(
            'Are you sure you want to clear ALL tracking data?\n\n' +
            'This will permanently delete:\n' +
            '• All tracked packages\n' +
            '• All tracking history\n' +
            '• All settings\n\n' +
            'This action cannot be undone.'
        );

        if (confirmation) {
            try {
                // Clear all localStorage data
                localStorage.removeItem(storageManager.storageKey);
                localStorage.removeItem(storageManager.settingsKey);
                
                // Reset settings to defaults
                this.settings = {
                    showCompleted: false,
                    autoRefreshInterval: 30,
                    lastAutoRefresh: null
                };
                
                // Update UI
                this.showCompletedCheckbox.checked = false;
                this.renderPackages();
                
                this.showSuccess('All data has been cleared successfully');
                console.log('All tracking data cleared from localStorage');
                
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showError('Error clearing data. Please try again.');
            }
        }
    }

    /**
     * Track packages in background and update UI
     */
    async trackPackagesInBackground(packageIds) {
        if (this.isLoading) return;
        
        this.setLoading(true);
        
        try {
            const packages = storageManager.getPackages();
            const packagesToTrack = packages.filter(pkg => packageIds.includes(pkg.id));
            
            // Track packages in parallel
            const trackingPromises = packagesToTrack.map(async (packageData) => {
                try {
                    // Ensure carrier is a string, not an object
                    const carrierCode = typeof packageData.carrier === 'string' 
                        ? packageData.carrier 
                        : packageData.carrier?.code || 'unknown';
                    
                    const result = await trackerRegistry.trackPackage(
                        packageData.trackingNumber, 
                        carrierCode
                    );
                    
                    // Update package with new tracking info
                    const updateData = {
                        ...result,
                        lastChecked: new Date().toISOString(),
                        // Preserve original carrier info
                        carrier: packageData.carrier
                    };
                    
                    if (result.status === 'delivered' && !packageData.deliveredDate) {
                        updateData.deliveredDate = result.deliveredDate || new Date().toISOString();
                    }
                    
                    return storageManager.updatePackage(packageData.id, updateData);
                    
                } catch (error) {
                    console.error(`Error tracking package ${packageData.trackingNumber}:`, error);
                    return storageManager.updatePackage(packageData.id, {
                        status: 'unavailable',
                        statusDescription: `Click "View on ${packageData.carrier?.toUpperCase() || 'Carrier'}" below for official tracking information.`,
                        lastChecked: new Date().toISOString(),
                        dataUnavailable: true
                    });
                }
            });

            await Promise.all(trackingPromises);
            this.renderPackages();
            
        } catch (error) {
            console.error('Error tracking packages:', error);
            this.showError('Error updating package information');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Render all packages
     */
    renderPackages() {
        const packages = storageManager.getPackages();
        const filteredPackages = this.settings.showCompleted 
            ? packages 
            : packages.filter(pkg => !pkg.isCompleted);

        // Sort packages by last checked date (newest first)
        filteredPackages.sort((a, b) => {
            const dateA = new Date(a.lastChecked || a.addedDate);
            const dateB = new Date(b.lastChecked || b.addedDate);
            return dateB - dateA;
        });

        if (filteredPackages.length === 0) {
            this.packagesContainer.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }

        this.packagesContainer.style.display = 'grid';
        this.emptyState.style.display = 'none';

        this.packagesContainer.innerHTML = filteredPackages.map(pkg => 
            this.renderPackageCard(pkg)
        ).join('');

        // Bind package card events
        this.bindPackageCardEvents();
    }

    /**
     * Render individual package card
     */
    renderPackageCard(packageData) {
        const carrier = trackerRegistry.getCarrier(packageData.carrier);
        const carrierName = carrier ? carrier.name : 'Unknown';
        const carrierColor = carrier ? carrier.color : '#64748b';
        
        const lastChecked = packageData.lastChecked 
            ? new Date(packageData.lastChecked).toLocaleString()
            : 'Never checked';

        const statusClass = this.getStatusClass(packageData.status);
        const statusIcon = this.getStatusIcon(packageData.status);

        return `
            <div class="package-card ${statusClass}" data-package-id="${packageData.id}">
                <div class="package-header">
                    <div class="carrier-info">
                        <div class="carrier-logo" style="background-color: ${carrierColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px;">
                            ${carrierName.charAt(0)}
                        </div>
                        <span class="carrier-name">${carrierName}</span>
                    </div>
                </div>
                
                <div class="tracking-number">${packageData.trackingNumber}</div>
                
                <div class="status-info">
                    ${packageData.dataUnavailable ? `
                        <div class="status-message">
                            <i class="fas fa-${statusIcon}"></i>
                            ${packageData.statusDescription}
                        </div>
                    ` : `
                        <div class="status-badge ${statusClass}">
                            <i class="fas fa-${statusIcon}"></i>
                            ${packageData.status.replace('-', ' ').toUpperCase()}
                            ${packageData.isReal ? ' ✓' : ''}
                        </div>
                        <div class="status-description">${packageData.statusDescription || 'No status available'}</div>
                        ${packageData.source ? `<div class="data-source"><i class="fas fa-info-circle"></i> Source: ${packageData.source}</div>` : ''}
                        ${packageData.location ? `<div class="location"><i class="fas fa-map-marker-alt"></i> ${packageData.location}</div>` : ''}
                        <div class="last-updated">Last updated: ${lastChecked}</div>
                    `}
                </div>

                <div class="package-actions">
                    ${packageData.trackingUrl ? `<a href="${packageData.trackingUrl}" target="_blank" class="btn-small btn-link">
                        <i class="fas fa-external-link-alt"></i> View on ${carrierName}
                    </a>` : ''}
                    ${!packageData.dataUnavailable ? `<button class="btn-small btn-refresh" data-action="refresh">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>` : ''}
                    <button class="btn-small btn-remove" data-action="remove">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Bind events for package cards
     */
    bindPackageCardEvents() {
        // Handle refresh and remove buttons
        this.packagesContainer.addEventListener('click', async (e) => {
            const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;

            const packageCard = e.target.closest('.package-card');
            const packageId = packageCard?.dataset.packageId;
            if (!packageId) return;

            e.preventDefault();
            e.stopPropagation();

            switch (action) {
                case 'refresh':
                    await this.trackPackagesInBackground([packageId]);
                    break;
                case 'remove':
                    this.handleRemovePackage(packageId);
                    break;
            }
        });
    }

    /**
     * Handle removing a package
     */
    handleRemovePackage(packageId) {
        if (confirm('Are you sure you want to remove this package from tracking?')) {
            storageManager.removePackage(packageId);
            this.renderPackages();
            this.showSuccess('Package removed from tracking');
        }
    }

    /**
     * Get CSS class for status
     */
    getStatusClass(status) {
        switch (status) {
            case 'delivered': return 'delivered';
            case 'in-transit': case 'out-for-delivery': return 'in-transit';
            case 'unavailable': return 'unavailable';
            default: return 'unknown';
        }
    }

    /**
     * Get icon for status
     */
    getStatusIcon(status) {
        switch (status) {
            case 'delivered': return 'check-circle';
            case 'in-transit': return 'truck';
            case 'out-for-delivery': return 'shipping-fast';
            case 'unavailable': return 'external-link-alt';
            default: return 'question-circle';
        }
    }

    /**
     * Set loading state
     */
    setLoading(isLoading) {
        this.isLoading = isLoading;
        this.loadingElement.classList.toggle('hidden', !isLoading);
        this.addPackagesBtn.disabled = isLoading;
        this.refreshAllBtn.disabled = isLoading;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        console.log('Success:', message);
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Error:', message);
        alert(message);
    }

    /**
     * Clean up old packages periodically
     */
    cleanupOldPackages() {
        storageManager.cleanupOldPackages();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PackageTrackerApp();
}); 