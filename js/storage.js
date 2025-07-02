/**
 * Storage utility for managing package tracking data
 * Uses localStorage with cookie fallback if needed
 */
class StorageManager {
    constructor() {
        this.storageKey = 'packageTracker_packages';
        this.settingsKey = 'packageTracker_settings';
    }

    /**
     * Get all packages from storage
     * @returns {Array} Array of package objects
     */
    getPackages() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading packages from storage:', error);
            return [];
        }
    }

    /**
     * Save packages to storage
     * @param {Array} packages - Array of package objects
     */
    savePackages(packages) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(packages));
        } catch (error) {
            console.error('Error saving packages to storage:', error);
        }
    }

    /**
     * Add a new package
     * @param {Object} packageData - Package data object
     */
    addPackage(packageData) {
        const packages = this.getPackages();
        const newPackage = {
            id: this.generateId(),
            trackingNumber: packageData.trackingNumber,
            carrier: packageData.carrier,
            addedDate: new Date().toISOString(),
            lastChecked: null,
            status: 'unknown',
            statusDescription: 'Not checked yet',
            trackingUrl: packageData.trackingUrl || '',
            isCompleted: false,
            completedDate: null,
            ...packageData
        };
        
        packages.push(newPackage);
        this.savePackages(packages);
        return newPackage;
    }

    /**
     * Update package status
     * @param {string} packageId - Package ID
     * @param {Object} updateData - Data to update
     */
    updatePackage(packageId, updateData) {
        const packages = this.getPackages();
        const packageIndex = packages.findIndex(pkg => pkg.id === packageId);
        
        if (packageIndex !== -1) {
            packages[packageIndex] = { ...packages[packageIndex], ...updateData };
            
            // Auto-mark as completed if delivered for more than a week
            if (packages[packageIndex].status === 'delivered' && !packages[packageIndex].isCompleted) {
                const deliveredDate = new Date(packages[packageIndex].deliveredDate || packages[packageIndex].lastChecked);
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                
                if (deliveredDate < oneWeekAgo) {
                    packages[packageIndex].isCompleted = true;
                    packages[packageIndex].completedDate = new Date().toISOString();
                }
            }
            
            this.savePackages(packages);
            return packages[packageIndex];
        }
        return null;
    }

    /**
     * Remove a package
     * @param {string} packageId - Package ID
     */
    removePackage(packageId) {
        const packages = this.getPackages();
        const filteredPackages = packages.filter(pkg => pkg.id !== packageId);
        this.savePackages(filteredPackages);
    }

    /**
     * Get package by tracking number
     * @param {string} trackingNumber - Tracking number
     * @returns {Object|null} Package object or null
     */
    getPackageByTrackingNumber(trackingNumber) {
        const packages = this.getPackages();
        return packages.find(pkg => pkg.trackingNumber === trackingNumber) || null;
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
        const packages = this.getPackages();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const filteredPackages = packages.filter(pkg => {
            if (pkg.isCompleted && pkg.completedDate) {
                const completedDate = new Date(pkg.completedDate);
                return completedDate > threeMonthsAgo;
            }
            return true;
        });
        
        if (filteredPackages.length !== packages.length) {
            this.savePackages(filteredPackages);
            console.log(`Cleaned up ${packages.length - filteredPackages.length} old packages`);
        }
    }
}

// Create global instance
window.storageManager = new StorageManager(); 