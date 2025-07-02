/**
 * Storage Tests
 */

const TestRunner = require('./test-runner');
const { setupTestEnvironment, mockLocalStorage } = require('./test-setup');

async function runStorageTests() {
    const test = new TestRunner();
    const env = setupTestEnvironment();

    test.test('StorageManager Creation', function() {
        const storage = new env.StorageManager();
        this.assertNotNull(storage, 'Storage manager should be created');
        this.assertEquals(storage.storageKey, 'packageTracker_packages', 'Should have correct storage key');
    });

    test.test('Add Package - Minimal Storage', function() {
        mockLocalStorage.clear();
        const storage = new env.StorageManager();
        
        const packageData = { trackingNumber: '9405536106193298175824' };
        const newPackage = storage.addPackage(packageData);
        
        this.assertNotNull(newPackage, 'Should return package');
        this.assertEquals(newPackage.trackingNumber, '9405536106193298175824', 'Should have tracking number');
        this.assertEquals(newPackage.carrier, 'usps', 'Should detect USPS carrier');
        this.assertEquals(newPackage.notes, '', 'Should have empty notes by default');
        
        // Check minimal storage includes notes field
        const rawPackages = storage.getRawPackages();
        this.assertEquals(rawPackages.length, 1, 'Should have 1 raw package');
        this.assertEquals(Object.keys(rawPackages[0]).length, 4, 'Should have 4 fields in storage (including notes)');
        this.assertTrue(rawPackages[0].hasOwnProperty('notes'), 'Should have notes field');
    });

    test.test('Package Notes Management', function() {
        mockLocalStorage.clear();
        const storage = new env.StorageManager();
        
        // Add package with notes
        const packageData = { 
            trackingNumber: '9405536106193298175824',
            notes: 'Birthday gift for mom'
        };
        const newPackage = storage.addPackage(packageData);
        
        this.assertEquals(newPackage.notes, 'Birthday gift for mom', 'Should store notes');
        
        // Update notes
        const updatedPackage = storage.updatePackageNotes(newPackage.id, 'Updated: Birthday gift for mom - urgent!');
        this.assertEquals(updatedPackage.notes, 'Updated: Birthday gift for mom - urgent!', 'Should update notes');
        
        // Clear notes
        const clearedPackage = storage.updatePackageNotes(newPackage.id, '');
        this.assertEquals(clearedPackage.notes, '', 'Should clear notes');
    });

    return await test.run();
}

module.exports = runStorageTests;
