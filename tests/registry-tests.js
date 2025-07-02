/**
 * TrackerRegistry Tests
 */

const TestRunner = require('./test-runner');
const { setupTestEnvironment } = require('./test-setup');

async function runRegistryTests() {
    const test = new TestRunner();
    const env = setupTestEnvironment();

    test.test('TrackerRegistry Creation', function() {
        const registry = new env.TrackerRegistry();
        this.assertNotNull(registry, 'Registry should be created');
        this.assertTrue(registry.carriers instanceof Map, 'Registry should have carriers Map');
        this.assertTrue(registry.carriers.size >= 4, 'Registry should auto-initialize with carriers');
    });

    test.test('Carrier Registration', function() {
        const registry = new env.TrackerRegistry();
        const initialSize = registry.carriers.size;
        const usps = new env.USPSCarrier();
        
        registry.registerCarrier(usps);
        this.assertTrue(registry.carriers.size >= initialSize, 'Should have at least the initial carriers');
        this.assertNotNull(registry.getCarrier('usps'), 'Should return USPS carrier');
    });

    test.test('Duplicate Registration Prevention', function() {
        const registry = new env.TrackerRegistry();
        const initialSize = registry.carriers.size;
        const usps1 = new env.USPSCarrier();
        const usps2 = new env.USPSCarrier();
        
        registry.registerCarrier(usps1);
        const sizeAfterFirst = registry.carriers.size;
        registry.registerCarrier(usps2); // Should not duplicate
        
        this.assertEquals(registry.carriers.size, sizeAfterFirst, 'Should not duplicate carriers');
    });

    test.test('Initialize All Carriers', function() {
        const registry = new env.TrackerRegistry();
        registry.initializeCarriers();
        
        this.assertEquals(registry.carriers.size, 4, 'Should have 4 carriers');
        this.assertNotNull(registry.getCarrier('usps'), 'Should have USPS');
        this.assertNotNull(registry.getCarrier('ups'), 'Should have UPS');
        this.assertNotNull(registry.getCarrier('fedex'), 'Should have FedEx');
        this.assertNotNull(registry.getCarrier('dhl'), 'Should have DHL');
    });

    test.test('Global Registry Initialization', function() {
        // Test that the global registry is properly initialized
        this.assertNotNull(env.trackerRegistry, 'Global registry should exist');
        this.assertTrue(env.trackerRegistry.carriers.size >= 4, 'Global registry should have carriers');
    });

    test.test('Carrier Detection - User Tracking Numbers', function() {
        const registry = env.trackerRegistry;
        
        // Test the specific tracking numbers from the user's issue
        const userNumbers = [
            { number: '9405536106193298175824', expected: 'usps' },
            { number: '9400136106193369031407', expected: 'usps' },
            { number: '9400136106193369304938', expected: 'usps' },
            { number: '1ZH764V40332521616', expected: 'ups' }
        ];
        
        userNumbers.forEach(({ number, expected }) => {
            const carrier = registry.detectCarrier(number);
            this.assertNotNull(carrier, `Should detect carrier for ${number}`);
            this.assertEquals(carrier.code, expected, `${number} should be detected as ${expected}`);
        });
    });

    test.test('Carrier Detection Priority', function() {
        const registry = env.trackerRegistry;
        
        // UPS should be detected before other carriers for 1Z format
        const upsNumber = '1Z12345E0205271688';
        const carrier = registry.detectCarrier(upsNumber);
        this.assertEquals(carrier.code, 'ups', 'UPS should be detected first for 1Z numbers');
        
        // USPS should be detected for 94 prefix (not FedEx)
        const uspsNumber = '9405536106193298175824';
        const uspsCarrier = registry.detectCarrier(uspsNumber);
        this.assertEquals(uspsCarrier.code, 'usps', 'USPS should be detected for 94 prefix, not FedEx');
    });

    test.test('Edge Cases', function() {
        const registry = env.trackerRegistry;
        
        // Empty/null input
        this.assertNull(registry.detectCarrier(''), 'Empty string should return null');
        this.assertNull(registry.detectCarrier(null), 'Null should return null');
        this.assertNull(registry.detectCarrier(undefined), 'Undefined should return null');
        
        // Whitespace handling
        const carrier = registry.detectCarrier('  9405536106193298175824  ');
        this.assertEquals(carrier.code, 'usps', 'Should handle whitespace');
        
        // Case handling
        const lowerCarrier = registry.detectCarrier('1zh764v40332521616');
        this.assertEquals(lowerCarrier.code, 'ups', 'Should handle lowercase');
    });

    test.test('Parse Tracking Numbers', function() {
        const registry = env.trackerRegistry;
        
        // Test multi-line input
        const input = `9405536106193298175824
        1ZH764V40332521616
        9400136106193369031407`;
        
        const numbers = registry.parseTrackingNumbers(input);
        this.assertEquals(numbers.length, 3, 'Should parse 3 tracking numbers');
        this.assertTrue(numbers.includes('9405536106193298175824'), 'Should include first number');
        this.assertTrue(numbers.includes('1ZH764V40332521616'), 'Should include UPS number');
        this.assertTrue(numbers.includes('9400136106193369031407'), 'Should include third number');
    });

    test.test('Validation', function() {
        const registry = env.trackerRegistry;
        
        // Valid tracking numbers
        const validResult = registry.validateTrackingNumber('9405536106193298175824');
        this.assertTrue(validResult.valid, 'Valid USPS number should pass validation');
        this.assertEquals(validResult.carrier.code, 'usps', 'Should identify correct carrier');
        
        // Invalid tracking numbers
        const invalidResult = registry.validateTrackingNumber('123');
        this.assertFalse(invalidResult.valid, 'Short number should fail validation');
    });

    return await test.run();
}

module.exports = runRegistryTests; 