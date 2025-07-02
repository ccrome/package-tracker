/**
 * Carrier Detection Tests
 */

const TestRunner = require('./test-runner');
const { setupTestEnvironment } = require('./test-setup');

async function runCarrierTests() {
    const test = new TestRunner();
    const env = setupTestEnvironment();

    // Test Data - Real tracking numbers from different carriers
    const testTrackingNumbers = {
        usps: [
            '9405536106193298175824', // User's working USPS number (22 digits)
            '9400136106193369031407', // User's other USPS number (22 digits)
            '9400136106193369304938', // User's third USPS number (22 digits)
            '9400123456789012345678', // Generic 94 prefix (22 digits)
            '9300123456789012345678', // Generic 93 prefix (22 digits) 
            '9200123456789012345678', // Generic 92 prefix (22 digits)
            'EA123456789US',          // Express Mail (13 chars)
            '8201234567'              // Other USPS format (10 digits)
        ],
        ups: [
            '1ZH764V40332521616',     // User's UPS number (18 chars total)
            '1Z12345E0205271688',     // Standard UPS format (18 chars total)
            '1Z999AA12345678901',     // Another UPS format (18 chars total)
            'T1234567890',            // UPS Express (11 chars total)
            '123456789',              // UPS Ground 9 digits
            '123456789012'            // UPS Ground 12 digits
        ],
        fedex: [
            '123456789012',           // 12 digits
            '12345678901234',         // 14 digits
            '123456789012345',        // 15 digits
            '12345678901234567890',   // 20 digits
            '6129999567126691099',    // FedEx SmartPost
        ],
        dhl: [
            '1234567890',             // 10 digits
            '12345678901',            // 11 digits
            'ABC1234567',             // 3 letters + 7 digits
            'AB123456789'             // 2 letters + 9 digits
        ],
        invalid: [
            '',                       // Empty
            '123',                    // Too short
            'INVALID',                // Not a tracking number
            '1234567',                // Too short
            'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // Too long
        ]
    };

    // Test individual carrier pattern matching
    test.test('USPS Carrier Creation', function() {
        const usps = new env.USPSCarrier();
        this.assertEquals(usps.name, 'USPS', 'USPS carrier name');
        this.assertEquals(usps.code, 'usps', 'USPS carrier code');
        this.assertTrue(Array.isArray(usps.patterns), 'USPS patterns is array');
        this.assertTrue(usps.patterns.length > 0, 'USPS has patterns');
    });

    test.test('UPS Carrier Creation', function() {
        const ups = new env.UPSCarrier();
        this.assertEquals(ups.name, 'UPS', 'UPS carrier name');
        this.assertEquals(ups.code, 'ups', 'UPS carrier code');
        this.assertTrue(Array.isArray(ups.patterns), 'UPS patterns is array');
        this.assertTrue(ups.patterns.length > 0, 'UPS has patterns');
    });

    test.test('FedEx Carrier Creation', function() {
        const fedex = new env.FedExCarrier();
        this.assertEquals(fedex.name, 'FedEx', 'FedEx carrier name');
        this.assertEquals(fedex.code, 'fedex', 'FedEx carrier code');
        this.assertTrue(Array.isArray(fedex.patterns), 'FedEx patterns is array');
        this.assertTrue(fedex.patterns.length > 0, 'FedEx has patterns');
    });

    test.test('DHL Carrier Creation', function() {
        const dhl = new env.DHLCarrier();
        this.assertEquals(dhl.name, 'DHL', 'DHL carrier name');
        this.assertEquals(dhl.code, 'dhl', 'DHL carrier code');
        this.assertTrue(Array.isArray(dhl.patterns), 'DHL patterns is array');
        this.assertTrue(dhl.patterns.length > 0, 'DHL has patterns');
    });

    // Test USPS pattern matching
    test.test('USPS Pattern Matching', function() {
        const usps = new env.USPSCarrier();
        
        testTrackingNumbers.usps.forEach(trackingNumber => {
            const matches = usps.matches(trackingNumber);
            this.assertTrue(matches, `USPS should match: ${trackingNumber}`);
        });
        
        // Test that USPS doesn't match other carriers' numbers
        testTrackingNumbers.ups.forEach(trackingNumber => {
            const matches = usps.matches(trackingNumber);
            this.assertFalse(matches, `USPS should NOT match UPS number: ${trackingNumber}`);
        });
    });

    // Test UPS pattern matching
    test.test('UPS Pattern Matching', function() {
        const ups = new env.UPSCarrier();
        
        testTrackingNumbers.ups.forEach(trackingNumber => {
            const matches = ups.matches(trackingNumber);
            this.assertTrue(matches, `UPS should match: ${trackingNumber}`);
        });
        
        // Test specific UPS patterns that were failing
        this.assertTrue(ups.matches('1ZH764V40332521616'), 'UPS should match user tracking number');
        this.assertTrue(ups.matches('1Z12345E0205271688'), 'UPS should match standard format');
    });

    // Test FedEx pattern matching (should NOT match USPS numbers)
    test.test('FedEx Pattern Matching', function() {
        const fedex = new env.FedExCarrier();
        
        testTrackingNumbers.fedex.forEach(trackingNumber => {
            const matches = fedex.matches(trackingNumber);
            this.assertTrue(matches, `FedEx should match: ${trackingNumber}`);
        });
        
        // Critical: FedEx should NOT match USPS numbers starting with 94
        const uspsNumbers = ['9405536106193298175824', '9400123456789012345678', '9300123456789012345678'];
        uspsNumbers.forEach(trackingNumber => {
            const matches = fedex.matches(trackingNumber);
            this.assertFalse(matches, `FedEx should NOT match USPS number: ${trackingNumber}`);
        });
    });

    // Test DHL pattern matching
    test.test('DHL Pattern Matching', function() {
        const dhl = new env.DHLCarrier();
        
        testTrackingNumbers.dhl.forEach(trackingNumber => {
            const matches = dhl.matches(trackingNumber);
            this.assertTrue(matches, `DHL should match: ${trackingNumber}`);
        });
    });

    // Test invalid tracking numbers
    test.test('Invalid Tracking Numbers', function() {
        const carriers = [
            new env.USPSCarrier(),
            new env.UPSCarrier(),
            new env.FedExCarrier(),
            new env.DHLCarrier()
        ];
        
        testTrackingNumbers.invalid.forEach(trackingNumber => {
            carriers.forEach(carrier => {
                const matches = carrier.matches(trackingNumber);
                this.assertFalse(matches, `${carrier.name} should NOT match invalid: "${trackingNumber}"`);
            });
        });
    });

    // Test URL generation
    test.test('Tracking URL Generation', function() {
        const usps = new env.USPSCarrier();
        const ups = new env.UPSCarrier();
        
        const uspsUrl = usps.getUrl('9405536106193298175824');
        this.assertTrue(uspsUrl.includes('9405536106193298175824'), 'USPS URL contains tracking number');
        this.assertTrue(uspsUrl.includes('usps.com'), 'USPS URL contains domain');
        
        const upsUrl = ups.getUrl('1ZH764V40332521616');
        this.assertTrue(upsUrl.includes('1ZH764V40332521616'), 'UPS URL contains tracking number');
        this.assertTrue(upsUrl.includes('ups.com'), 'UPS URL contains domain');
    });

    return await test.run();
}

module.exports = runCarrierTests; 