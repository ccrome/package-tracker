/**
 * Backend Service - Handles server detection and API routing
 */
class BackendService {
    constructor() {
        this.isAvailable = false;
        this.baseUrl = window.location.origin;
        this.apiPath = '/api/track';
        this.init();
    }

    /**
     * Initialize backend service and detect availability
     */
    async init() {
        try {
            // Try to ping the backend
            const response = await fetch(`${this.baseUrl}${this.apiPath}/ping`, {
                method: 'GET',
                timeout: 2000 // 2 second timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isAvailable = data.available === true;
                console.log('Backend detected:', this.isAvailable ? 'Available' : 'Not available');
            }
        } catch (error) {
            console.log('No backend detected - running in standalone mode');
            this.isAvailable = false;
        }

        // Notify app of backend status
        this.notifyStatusChange();
    }

    /**
     * Track a package using backend API
     * @param {string} trackingNumber - Tracking number
     * @param {string} carrier - Carrier code
     * @returns {Promise<Object>} Tracking result
     */
    async trackPackage(trackingNumber, carrier) {
        if (!this.isAvailable) {
            throw new Error('Backend not available');
        }

        try {
            const response = await fetch(`${this.baseUrl}${this.apiPath}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    trackingNumber: trackingNumber,
                    carrier: carrier
                })
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            const data = await response.json();
            
            // Add backend source indicator
            if (data.success) {
                data.data.source = 'Backend API';
                data.data.isReal = true;
                return data.data;
            } else {
                throw new Error(data.error || 'Backend tracking failed');
            }

        } catch (error) {
            console.error('Backend tracking error:', error);
            throw error;
        }
    }

    /**
     * Get backend capabilities
     * @returns {Promise<Object>} Available carriers and features
     */
    async getCapabilities() {
        if (!this.isAvailable) {
            return { carriers: [], features: [] };
        }

        try {
            const response = await fetch(`${this.baseUrl}${this.apiPath}/capabilities`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error getting backend capabilities:', error);
        }

        return { carriers: [], features: [] };
    }

    /**
     * Notify app of backend status changes
     */
    notifyStatusChange() {
        window.dispatchEvent(new CustomEvent('backendStatusChange', {
            detail: { 
                available: this.isAvailable,
                mode: this.isAvailable ? 'client-server' : 'standalone'
            }
        }));
    }

    /**
     * Test backend connection
     */
    async testConnection() {
        return await this.init();
    }
}

// Create global instance
window.backendService = new BackendService(); 