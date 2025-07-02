#!/usr/bin/env node

/**
 * Main Test Runner - Executes all test suites
 */

const runCarrierTests = require('./carrier-tests');
const runRegistryTests = require('./registry-tests');
const runStorageTests = require('./storage-tests');

async function runAllTests() {
    console.log('🚀 Package Tracker - Test Suite\n');
    console.log('===============================\n');
    
    let totalPassed = 0;
    let totalFailed = 0;
    const results = [];
    
    // Run all test suites
    const testSuites = [
        { name: '📦 Carrier Tests', runner: runCarrierTests },
        { name: '🔍 Registry Tests', runner: runRegistryTests },
        { name: '💾 Storage Tests', runner: runStorageTests }
    ];
    
    for (const suite of testSuites) {
        console.log(`\n${suite.name}`);
        console.log('='.repeat(suite.name.length));
        
        try {
            const success = await suite.runner();
            results.push({ name: suite.name, success });
            
            if (success) {
                console.log(`✅ ${suite.name} - All tests passed!`);
            } else {
                console.log(`❌ ${suite.name} - Some tests failed!`);
            }
        } catch (error) {
            console.error(`💥 ${suite.name} - Test suite crashed:`, error.message);
            results.push({ name: suite.name, success: false, error: error.message });
        }
    }
    
    // Print final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passedSuites = results.filter(r => r.success).length;
    const failedSuites = results.filter(r => !r.success).length;
    
    console.log(`✅ Passed Test Suites: ${passedSuites}`);
    console.log(`❌ Failed Test Suites: ${failedSuites}`);
    console.log(`📈 Total Test Suites:  ${results.length}`);
    
    if (failedSuites > 0) {
        console.log('\n❌ Failed Test Suites:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   ${r.name}${r.error ? ': ' + r.error : ''}`);
        });
    }
    
    const allPassed = failedSuites === 0;
    console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '💥 SOME TESTS FAILED!'}`);
    
    if (allPassed) {
        console.log('\n🚀 Your package tracker is working correctly!');
        console.log('   • Carrier detection is accurate');
        console.log('   • Pattern matching works for all carriers');
        console.log('   • Storage system is efficient');
        console.log('   • Registry functions properly');
    } else {
        console.log('\n🔧 Please fix the failing tests before deploying.');
    }
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('💥 Test runner crashed:', error);
        process.exit(1);
    });
}

module.exports = runAllTests; 