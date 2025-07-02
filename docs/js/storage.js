/**
 * Storage utility for managing package tracking data
 * Uses localStorage - only stores minimal data, everything else computed dynamically
 */
class StorageManager {
    constructor() {
        this.storageKey = 'packageTracker_packages';
        this.settingsKey = 'packageTracker_settings';
        this.cacheKey = 'packageTracker_cache'; // For temporary tracking data
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get all packages from storage with computed data
     * @returns {Array} Array of package objects with computed fields
     */
    getPackages() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const packages = data ? JSON.parse(data) : [];
            
            // Hydrate each package with computed data
            return packages.map(pkg => this.hydratePackage(pkg));
        } catch (error) {
            console.error('Error loading packages from storage:', error);
            return [];
        }
    }

    /**
     * Get raw packages from storage (minimal data only)
     * @returns {Array} Array of minimal package objects
     */
    getRawPackages() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading packages from storage:', error);
            return [];
        }
    }

    /**
     * Hydrate a package with computed data
     * @param {Object} rawPackage - Minimal package data
     * @returns {Object} Full package object with computed fields
     */
    hydratePackage(rawPackage) {
        // Detect carrier dynamically (with safety check)
        let carrier = null;
        try {
            if (window.trackerRegistry && window.trackerRegistry.detectCarrier) {
                // If no carriers are loaded, try to retry initialization
                if (window.trackerRegistry.carriers.size === 0) {
                    console.log('No carriers loaded, retrying initialization...');
                    window.trackerRegistry.initializeCarriers();
                }
                carrier = window.trackerRegistry.detectCarrier(rawPackage.trackingNumber);
            }
        } catch (error) {
            console.warn('Error detecting carrier:', error);
        }
        
        // Get cached tracking data if available and not expired
        const cachedData = this.getCachedTrackingData(rawPackage.id);
        
        // Use manual completion status if set, otherwise compute from tracking data
        const isCompleted = rawPackage.isCompleted !== undefined 
            ? rawPackage.isCompleted 
            : this.computeCompletionStatus(cachedData);
        
        const completedDate = rawPackage.completedDate || 
            (isCompleted && !rawPackage.isCompleted ? this.computeCompletedDate(cachedData) : null);
        
        return {
            ...rawPackage,
            // Computed fields - ensure carrier is always a string code
            carrier: carrier ? carrier.code : 'unknown',
            carrierName: carrier ? carrier.name : 'Unknown',
            trackingUrl: carrier ? carrier.getUrl(rawPackage.trackingNumber) : '',
            
            // Completion status - manual override or automatic
            isCompleted: isCompleted,
            completedDate: completedDate,
            
            // Cached/default tracking data
            status: cachedData?.status || 'unknown',
            statusDescription: cachedData?.statusDescription || 'Not checked yet',
            lastChecked: cachedData?.lastChecked || null,
            
            // Pass through any other cached data
            ...(cachedData || {})
        };
    }

    /**
     * Save packages to storage (minimal data only)
     * @param {Array} packages - Array of package objects
     */
    savePackages(packages) {
        try {
            // Extract only minimal data for storage (including notes and completion status)
            const minimalPackages = packages.map(pkg => ({
                id: pkg.id,
                trackingNumber: pkg.trackingNumber,
                addedDate: pkg.addedDate,
                notes: pkg.notes || '',
                isCompleted: pkg.isCompleted || false,
                completedDate: pkg.completedDate || null
            }));
            
            localStorage.setItem(this.storageKey, JSON.stringify(minimalPackages));
        } catch (error) {
            console.error('Error saving packages to storage:', error);
        }
    }

    /**
     * Add a new package (minimal data only)
     * @param {Object} packageData - Package data object
     */
    addPackage(packageData) {
        const packages = this.getRawPackages();
        const newPackage = {
            id: this.generateId(),
            trackingNumber: packageData.trackingNumber,
            addedDate: new Date().toISOString(),
            notes: packageData.notes || '',
            isCompleted: false,
            completedDate: null
        };
        
        packages.push(newPackage);
        this.savePackages(packages);
        
        // Return hydrated package
        return this.hydratePackage(newPackage);
    }

    /**
     * Update package tracking data (stored in cache, not persistent storage)
     * @param {string} packageId - Package ID
     * @param {Object} trackingData - Tracking data to cache
     */
    updatePackageTracking(packageId, trackingData) {
        // Store tracking data in cache with timestamp
        const cacheData = {
            ...trackingData,
            cachedAt: new Date().toISOString()
        };
        
        this.setCachedTrackingData(packageId, cacheData);
        
        // Return hydrated package
        const rawPackage = this.getRawPackages().find(pkg => pkg.id === packageId);
        return rawPackage ? this.hydratePackage(rawPackage) : null;
    }

    /**
     * Update package notes (stored persistently)
     * @param {string} packageId - Package ID
     * @param {string} notes - Notes text
     */
    updatePackageNotes(packageId, notes) {
        const packages = this.getRawPackages();
        const packageIndex = packages.findIndex(pkg => pkg.id === packageId);
        
        if (packageIndex !== -1) {
            packages[packageIndex].notes = notes || '';
            this.savePackages(packages);
            
            // Return updated hydrated package
            return this.hydratePackage(packages[packageIndex]);
        }
        
        return null;
    }

    /**
     * Update package completed status (stored persistently)
     * @param {string} packageId - Package ID
     * @param {boolean} isCompleted - Whether package is manually marked complete
     */
    updatePackageCompleted(packageId, isCompleted) {
        const packages = this.getRawPackages();
        const packageIndex = packages.findIndex(pkg => pkg.id === packageId);
        
        if (packageIndex !== -1) {
            packages[packageIndex].isCompleted = isCompleted;
            if (isCompleted) {
                packages[packageIndex].completedDate = new Date().toISOString();
            } else {
                packages[packageIndex].completedDate = null;
            }
            this.savePackages(packages);
            
            // Return updated hydrated package
            return this.hydratePackage(packages[packageIndex]);
        }
        
        return null;
    }



    /**
     * Get package by tracking number
     * @param {string} trackingNumber - Tracking number
     * @returns {Object|null} Hydrated package object or null
     */
    getPackageByTrackingNumber(trackingNumber) {
        const packages = this.getPackages();
        return packages.find(pkg => pkg.trackingNumber === trackingNumber) || null;
    }

    /**
     * Get cached tracking data for a package
     * @param {string} packageId - Package ID
     * @returns {Object|null} Cached data or null if expired/not found
     */
    getCachedTrackingData(packageId) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
            const packageCache = cache[packageId];
            
            if (!packageCache) return null;
            
            // Check if cache is expired
            const cacheAge = new Date() - new Date(packageCache.cachedAt);
            if (cacheAge > this.cacheExpiry) {
                // Clean up expired cache
                delete cache[packageId];
                localStorage.setItem(this.cacheKey, JSON.stringify(cache));
                return null;
            }
            
            return packageCache;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    /**
     * Set cached tracking data for a package
     * @param {string} packageId - Package ID
     * @param {Object} data - Data to cache
     */
    setCachedTrackingData(packageId, data) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
            cache[packageId] = data;
            localStorage.setItem(this.cacheKey, JSON.stringify(cache));
        } catch (error) {
            console.error('Error writing cache:', error);
        }
    }



    /**
     * Compute completion status based on tracking data
     * @param {Object} trackingData - Cached tracking data
     * @returns {boolean} Whether package is completed
     */
    computeCompletionStatus(trackingData) {
        if (!trackingData || trackingData.status !== 'delivered') {
            return false;
        }
        
        // Auto-complete if delivered for more than a week
        const deliveredDate = new Date(trackingData.deliveredDate || trackingData.lastChecked);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return deliveredDate < oneWeekAgo;
    }

    /**
     * Compute completed date based on tracking data
     * @param {Object} trackingData - Cached tracking data
     * @returns {string|null} Completed date or null
     */
    computeCompletedDate(trackingData) {
        if (!trackingData || trackingData.status !== 'delivered') {
            return null;
        }
        
        const deliveredDate = new Date(trackingData.deliveredDate || trackingData.lastChecked);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        if (deliveredDate < oneWeekAgo) {
            // Return the date one week after delivery
            const completedDate = new Date(deliveredDate);
            completedDate.setDate(completedDate.getDate() + 7);
            return completedDate.toISOString();
        }
        
        return null;
    }

    /**
     * Get user settings
     * @returns {Object} Settings object
     */
    getSettings() {
        try {
            const data = localStorage.getItem(this.settingsKey);
            return data ? JSON.parse(data) : {
                showCompleted: false,
                autoRefreshInterval: 30, // minutes
                lastAutoRefresh: null
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                showCompleted: false,
                autoRefreshInterval: 30,
                lastAutoRefresh: null
            };
        }
    }

    /**
     * Save user settings
     * @param {Object} settings - Settings object
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Generate unique ID for packages
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Clean up old completed packages (older than 3 months)
     */
    cleanupOldPackages() {
        const packages = this.getPackages(); // Get hydrated packages
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const activePackages = packages.filter(pkg => {
            if (pkg.isCompleted && pkg.completedDate) {
                const completedDate = new Date(pkg.completedDate);
                return completedDate > threeMonthsAgo;
            }
            return true;
        });
        
        if (activePackages.length !== packages.length) {
            // Save only the active packages (will be converted to minimal data)
            this.savePackages(activePackages);
            
            // Clean up cache for removed packages
            const removedPackages = packages.filter(pkg => !activePackages.some(active => active.id === pkg.id));
            removedPackages.forEach(pkg => this.clearCachedTrackingData(pkg.id));
            
            console.log(`Cleaned up ${packages.length - activePackages.length} old packages`);
        }
    }

    /**
     * Force re-detection of carriers for all packages
     * This clears cached data to trigger fresh carrier detection
     */
    forceRedetectCarriers() {
        try {
            // Clear all cached tracking data to force fresh detection
            localStorage.removeItem(this.cacheKey);
            console.log('Cleared carrier cache - packages will be re-detected');
            
            // If we have a way to trigger re-render, do it
            if (window.app && window.app.renderPackages) {
                window.app.renderPackages();
            }
        } catch (error) {
            console.error('Error forcing carrier re-detection:', error);
        }
    }

    /**
     * Migrate old storage format to new minimal format
     * This will run once to convert existing data
     */
    migrateStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return; // No data to migrate
            
            const packages = JSON.parse(data);
            if (packages.length === 0) return; // No packages to migrate
            
            // Check if already migrated (new format only has id, trackingNumber, addedDate, notes, isCompleted, completedDate)
            const firstPackage = packages[0];
            if (firstPackage && Object.keys(firstPackage).length <= 6 && 
                firstPackage.id && firstPackage.trackingNumber && firstPackage.addedDate &&
                firstPackage.hasOwnProperty('notes') && firstPackage.hasOwnProperty('isCompleted')) {
                return; // Already migrated
            }
            
            console.log('Migrating storage to minimal format...');
            
            // Extract minimal data and preserve tracking data in cache
            const minimalPackages = [];
            packages.forEach(pkg => {
                if (pkg.id && pkg.trackingNumber) {
                    // Store minimal data (including notes and completion status)
                    minimalPackages.push({
                        id: pkg.id,
                        trackingNumber: pkg.trackingNumber,
                        addedDate: pkg.addedDate || new Date().toISOString(),
                        notes: pkg.notes || '',
                        isCompleted: pkg.isCompleted || false,
                        completedDate: pkg.completedDate || null
                    });
                    
                    // Preserve tracking data in cache if available
                    if (pkg.status && pkg.status !== 'unknown') {
                        const trackingData = {
                            status: pkg.status,
                            statusDescription: pkg.statusDescription,
                            lastChecked: pkg.lastChecked,
                            deliveredDate: pkg.deliveredDate,
                            location: pkg.location,
                            source: pkg.source,
                            isReal: pkg.isReal,
                            dataUnavailable: pkg.dataUnavailable,
                            cachedAt: new Date().toISOString()
                        };
                        
                        // Remove undefined values
                        Object.keys(trackingData).forEach(key => {
                            if (trackingData[key] === undefined) {
                                delete trackingData[key];
                            }
                        });
                        
                        this.setCachedTrackingData(pkg.id, trackingData);
                    }
                }
            });
            
            // Save migrated data
            localStorage.setItem(this.storageKey, JSON.stringify(minimalPackages));
            console.log(`Migrated ${minimalPackages.length} packages to minimal storage format`);
            
            // Force re-detection of carriers for migrated packages
            this.forceRedetectCarriers();
            
        } catch (error) {
            console.error('Error migrating storage:', error);
        }
    }
}

// Export the class and create global instance  
window.StorageManager = StorageManager;
window.storageManager = new StorageManager();

// Global function to fix carrier detection issues
window.fixCarrierDetection = function() {
    console.log('Fixing carrier detection for all packages...');
    window.storageManager.forceRedetectCarriers();
    if (window.app && window.app.renderPackages) {
        window.app.renderPackages();
    }
    console.log('✓ Carrier detection fixed! Packages should now show correct carriers.');
};

// Run migration after DOM and all scripts are loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure trackerRegistry is fully initialized
        setTimeout(() => {
            window.storageManager.migrateStorage();
        }, 100);
    });
} else {
    // Document already loaded
    setTimeout(() => {
        window.storageManager.migrateStorage();
    }, 100);
} 