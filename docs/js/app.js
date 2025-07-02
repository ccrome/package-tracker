/**
 * Main Application Logic
 */
class PackageTrackerApp {
    constructor() {
        this.loadingElement = document.getElementById('loadingIndicator');
        this.packagesContainer = document.getElementById('packagesContainer');
        this.emptyState = document.getElementById('emptyState');
        this.openAllSection = document.getElementById('openAllSection');
        this.trackingInput = document.getElementById('trackingInput');
        this.addPackagesBtn = document.getElementById('addPackages');
        this.refreshAllBtn = document.getElementById('refreshAll');
        this.showCompletedCheckbox = document.getElementById('showCompleted');
        this.clearAllDataBtn = document.getElementById('clearAllData');
        this.openAllTabsBtn = document.getElementById('openAllTabs');
        
        this.packages = [];
        this.settings = { showCompleted: false };
        this.isLoading = false;
        this.isBackendAvailable = false;
        this.currentMode = 'standalone';
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Load stored data (this will now properly detect carriers)
            this.packages = storageManager.getPackages();
            this.settings = storageManager.getSettings();
            
            // Set up event listeners
            this.bindEvents();
            
            // Listen for backend status changes
            window.addEventListener('backendStatusChange', (event) => {
                this.handleBackendStatusChange(event.detail);
            });
            
            // Wait for backend service to initialize
            if (window.backendService) {
                await window.backendService.init();
            }
            
            // Initial render
            this.renderPackages();
            this.loadSettings();
            this.updateModeIndicator();
            
            // Set initial refresh button visibility
            this.refreshAllBtn.style.display = this.isBackendAvailable ? 'inline-flex' : 'none';
            
            // Clean up old packages
            this.cleanupOldPackages();
            
            console.log('Package Tracker App initialized');
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
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
        
        // Open all tabs button
        this.openAllTabsBtn.addEventListener('click', () => this.handleOpenAllTabs());
        
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
            const packageData = {
                trackingNumber
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
     * Handle opening all packages in new tabs
     */
    handleOpenAllTabs() {
        try {
            const packages = storageManager.getPackages();
            const filteredPackages = this.settings.showCompleted 
                ? packages 
                : packages.filter(pkg => !pkg.isCompleted);
            
            const packagesWithUrls = filteredPackages.filter(pkg => pkg.trackingUrl);
            
            if (packagesWithUrls.length === 0) {
                this.showError('No packages have tracking URLs available');
                return;
            }

            // Show confirmation for many tabs
            if (packagesWithUrls.length > 5) {
                const confirmation = confirm(
                    `You are about to open ${packagesWithUrls.length} new tabs.\n\n` +
                    'This may be blocked by your browser\'s popup blocker.\n' +
                    'Would you like to continue?'
                );
                if (!confirmation) return;
            }

            // Open each package URL in a new tab
            let openedCount = 0;
            packagesWithUrls.forEach((packageData, index) => {
                if (packageData.trackingUrl) {
                    // Add a small delay between opens to prevent browser blocking
                    setTimeout(() => {
                        try {
                            window.open(packageData.trackingUrl, '_blank');
                            openedCount++;
                        } catch (error) {
                            console.error(`Failed to open tab for ${packageData.trackingNumber}:`, error);
                        }
                    }, index * 100); // 100ms delay between each tab
                }
            });

            // Show success message
            setTimeout(() => {
                if (openedCount > 0) {
                    this.showSuccess(`Opened ${packagesWithUrls.length} package${packagesWithUrls.length > 1 ? 's' : ''} in new tabs`);
                } else {
                    this.showError('Failed to open tabs. Please check your browser settings and try again.');
                }
            }, packagesWithUrls.length * 100 + 500);

        } catch (error) {
            console.error('Error opening all tabs:', error);
            this.showError('Error opening tabs. Please try again.');
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
                    // Handle both string and object carrier values
                    const carrierCode = typeof packageData.carrier === 'string' 
                        ? packageData.carrier 
                        : packageData.carrier?.code || 'unknown';
                    
                    const result = await trackerRegistry.trackPackage(
                        packageData.trackingNumber, 
                        carrierCode
                    );
                    
                    // Update package tracking data (cached, not persistent)
                    const trackingData = {
                        ...result,
                        lastChecked: new Date().toISOString()
                    };
                    
                    if (result.status === 'delivered' && !result.deliveredDate) {
                        trackingData.deliveredDate = new Date().toISOString();
                    }
                    
                    return storageManager.updatePackageTracking(packageData.id, trackingData);
                    
                } catch (error) {
                    console.error(`Error tracking package ${packageData.trackingNumber}:`, error);
                    return storageManager.updatePackageTracking(packageData.id, {
                        status: 'unavailable',
                        statusDescription: `Click "View on ${packageData.carrierName || 'Carrier'}" below for official tracking information.`,
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
        
        // Filter by completed status (hide completed by default)
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
            this.openAllSection.classList.add('hidden');
            return;
        }

        this.packagesContainer.style.display = 'grid';
        this.emptyState.style.display = 'none';

        // Show/hide open all button based on packages with tracking URLs
        const packagesWithUrls = filteredPackages.filter(pkg => pkg.trackingUrl);
        if (packagesWithUrls.length > 0) {
            this.openAllSection.classList.remove('hidden');
            // Update button text with count
            const buttonText = packagesWithUrls.length === 1 
                ? 'Open Package in New Tab' 
                : `Open All ${packagesWithUrls.length} Packages in New Tabs`;
            this.openAllTabsBtn.innerHTML = `<i class="fas fa-external-link-alt"></i> ${buttonText}`;
        } else {
            this.openAllSection.classList.add('hidden');
        }

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
        // Ensure trackerRegistry is available and has carriers
        if (trackerRegistry.carriers.size === 0) {
            console.log('TrackerRegistry has no carriers, retrying initialization...');
            trackerRegistry.initializeCarriers();
        }
        
        const carrier = trackerRegistry.getCarrier(packageData.carrier);
        const carrierName = carrier ? carrier.name : 'Unknown';
        
        // Assign colors based on carrier
        let carrierColor = '#64748b'; // default gray
        if (carrier) {
            switch (carrier.code) {
                case 'usps': carrierColor = '#004B87'; break;
                case 'ups': carrierColor = '#8B4513'; break;
                case 'fedex': carrierColor = '#4d148c'; break;
                case 'dhl': carrierColor = '#FFD320'; break;
            }
        }
        
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
                
                <div class="package-notes">
                    <div class="notes-label"><i class="fas fa-sticky-note"></i> Notes:</div>
                    <textarea class="notes-input" placeholder="Add your notes here..." maxlength="500" data-package-id="${packageData.id}">${this.escapeHtml(packageData.notes || '')}</textarea>
                </div>
                
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
                    ${!packageData.dataUnavailable && this.isBackendAvailable ? `<button class="btn-small btn-refresh" data-action="refresh">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>` : ''}
                    <button class="btn-small btn-complete" data-action="complete">
                        <i class="fas fa-check-circle"></i> ${packageData.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
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
                case 'complete':
                    this.handleCompletePackage(packageId);
                    break;
            }
        });

        // Handle auto-save for notes
        this.packagesContainer.addEventListener('blur', async (e) => {
            if (e.target.classList.contains('notes-input')) {
                const packageId = e.target.dataset.packageId;
                const notes = e.target.value.trim();
                await this.handleAutoSaveNotes(packageId, notes);
            }
        }, true);

        // Optional: Save on Enter key (but allow Shift+Enter for new lines)
        this.packagesContainer.addEventListener('keydown', async (e) => {
            if (e.target.classList.contains('notes-input') && e.key === 'Enter' && !e.shiftKey) {
                e.target.blur(); // This will trigger the blur event above
            }
        });
    }



    /**
     * Handle completing/uncompleting a package
     */
    handleCompletePackage(packageId) {
        const packages = storageManager.getPackages();
        const packageData = packages.find(pkg => pkg.id === packageId);
        
        if (packageData) {
            const isCurrentlyCompleted = packageData.isCompleted || false;
            const updatedPackage = storageManager.updatePackageCompleted(packageId, !isCurrentlyCompleted);
            
            if (updatedPackage) {
                this.renderPackages();
                this.showSuccess(isCurrentlyCompleted ? 'Package marked incomplete' : 'Package marked complete');
            } else {
                this.showError('Failed to mark package');
            }
        }
    }

    /**
     * Handle auto-save for notes
     */
    async handleAutoSaveNotes(packageId, notes) {
        try {
            // Get current package to check if notes actually changed
            const packages = storageManager.getPackages();
            const currentPackage = packages.find(pkg => pkg.id === packageId);
            
            if (!currentPackage) {
                console.error('Package not found for auto-save');
                return;
            }
            
            // Only save if notes actually changed
            if ((currentPackage.notes || '') !== notes) {
                const updatedPackage = storageManager.updatePackageNotes(packageId, notes);
                
                if (updatedPackage) {
                    console.log('Notes auto-saved');
                } else {
                    console.error('Failed to auto-save notes');
                }
            }
        } catch (error) {
            console.error('Error auto-saving notes:', error);
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    /**
     * Handle backend status changes
     */
    handleBackendStatusChange(status) {
        this.isBackendAvailable = status.available;
        this.currentMode = status.mode;
        
        console.log(`App mode changed to: ${this.currentMode}`);
        this.updateModeIndicator();
        
        // Show/hide refresh all button based on backend availability
        this.refreshAllBtn.style.display = this.isBackendAvailable ? 'inline-flex' : 'none';
        
        // Re-render packages to show updated capabilities
        this.renderPackages();
    }

    /**
     * Update mode indicator in UI
     */
    updateModeIndicator() {
        const modeIndicator = document.getElementById('mode-indicator');
        if (modeIndicator) {
            const modeText = this.isBackendAvailable ? 
                '<span class="status-indicator backend">🟢 Server Mode</span>' : 
                '<span class="status-indicator standalone">🔗 Link Mode</span>';
            
            const modeDescription = this.isBackendAvailable ?
                'Real-time tracking data available' :
                'Links to official carrier tracking pages';
                
            modeIndicator.innerHTML = `
                <div class="mode-status">
                    ${modeText}
                    <small>${modeDescription}</small>
                </div>
            `;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PackageTrackerApp();
}); 