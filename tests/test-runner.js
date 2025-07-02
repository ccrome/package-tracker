/**
 * Simple Test Runner for Package Tracker
 */

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    // Test assertions
    assertEquals(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
        }
    }

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message || 'Assertion failed'}: expected true, got false`);
        }
    }

    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`${message || 'Assertion failed'}: expected false, got true`);
        }
    }

    assertNotNull(value, message = '') {
        if (value === null || value === undefined) {
            throw new Error(`${message || 'Assertion failed'}: expected non-null value, got ${value}`);
        }
    }

    assertNull(value, message = '') {
        if (value !== null && value !== undefined) {
            throw new Error(`${message || 'Assertion failed'}: expected null value, got ${value}`);
        }
    }

    assertMatches(string, pattern, message = '') {
        if (!pattern.test(string)) {
            throw new Error(`${message || 'Pattern match failed'}: "${string}" does not match ${pattern}`);
        }
    }

    // Test registration and execution
    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    async run() {
        console.log('🧪 Running Package Tracker Tests...\n');
        
        for (const test of this.tests) {
            try {
                await test.testFunction.call(this);
                this.passed++;
                this.results.push({ name: test.name, status: 'PASS', error: null });
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.failed++;
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }

        this.printSummary();
        return this.failed === 0;
    }

    printSummary() {
        console.log('\n📊 Test Summary:');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Total:  ${this.tests.length}`);
        
        if (this.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => r.status === 'FAIL').forEach(r => {
                console.log(`   ${r.name}: ${r.error}`);
            });
        }
        
        console.log(`\n${this.failed === 0 ? '🎉 All tests passed!' : '💥 Some tests failed!'}`);
    }
}

module.exports = TestRunner; 