# Package Tracker Test Suite

A comprehensive test suite for the Package Tracker application that validates carrier detection, pattern matching, registry functionality, and storage management.

## 🚀 Quick Start

```bash
# Run all tests
cd tests
node run-all-tests.js

# Or use npm scripts
npm test
```

## 📁 Test Structure

```
tests/
├── README.md              # This file
├── package.json           # Test suite configuration
├── run-all-tests.js       # Main test runner
├── test-runner.js         # Test framework implementation
├── test-setup.js          # Environment setup and mocking
├── carrier-tests.js       # Carrier pattern and behavior tests
├── registry-tests.js      # TrackerRegistry functionality tests
└── storage-tests.js       # StorageManager tests
```

## 🧪 Test Categories

### 📦 Carrier Tests
Tests for individual carrier implementations:
- **Carrier Creation**: Validates proper instantiation of all carriers
- **Pattern Matching**: Tests tracking number recognition for USPS, UPS, FedEx, DHL
- **URL Generation**: Verifies correct tracking URL construction
- **Edge Cases**: Tests invalid inputs and boundary conditions

**Validated Tracking Numbers:**
- USPS: `9405536106193298175824` (22 digits), Express Mail formats
- UPS: `1ZH764V40332521616` (1Z + 16 chars), Express formats  
- FedEx: Various digit patterns (12, 14, 15, 20, 22 digits)
- DHL: Multiple formats (10-11 digits, letter+digit combinations)

### 🔍 Registry Tests
Tests for the TrackerRegistry system:
- **Auto-initialization**: Registry automatically loads all carriers
- **Carrier Detection**: Correctly identifies carriers from tracking numbers
- **Priority Handling**: UPS patterns checked before broader patterns
- **Input Parsing**: Multi-line input processing with various delimiters
- **Validation**: Comprehensive tracking number validation

**Key Validations:**
- USPS numbers starting with 94 are NOT claimed by FedEx
- UPS 1Z format has detection priority
- Proper handling of whitespace and case variations

### 💾 Storage Tests  
Tests for the StorageManager and optimized storage:
- **Minimal Storage**: Only 4 fields stored (id, trackingNumber, addedDate, notes)
- **Package Hydration**: Dynamic computation of carrier, URLs, status  
- **Notes Management**: Add, edit, update, and clear package notes
- **Caching System**: 5-minute expiry for tracking data
- **Settings Management**: User preferences persistence

**Storage Optimization:**
- **Before**: ~15-20 fields per package stored in localStorage  
- **After**: Only 4 essential fields (id, trackingNumber, addedDate, notes) (80-90% reduction)
- Dynamic computation reduces storage bloat
- **Notes**: User-generated notes are stored persistently for each package

## 🔧 Test Framework

### Custom Test Runner
- **Assertions**: assertEquals, assertTrue, assertFalse, assertNull, assertMatches
- **Error Handling**: Comprehensive error reporting with context
- **Parallel Execution**: Fast test execution
- **Detailed Reporting**: Clear pass/fail statistics with error details

### Mock Environment
- **Browser Globals**: Mocks window, localStorage, document
- **Script Loading**: Dynamically loads and evaluates JS files
- **Global Propagation**: Ensures proper scope for Node.js testing

## 🎯 Test Results

When all tests pass, you'll see:
```
🎉 ALL TESTS PASSED!

🚀 Your package tracker is working correctly!
   • Carrier detection is accurate
   • Pattern matching works for all carriers  
   • Storage system is efficient
   • Registry functions properly
```

## 🔍 Debugging Failed Tests

### Pattern Matching Issues
```bash
# Debug specific patterns
node -e "const env = require('./test-setup').setupTestEnvironment(); console.log(new env.USPSCarrier().patterns)"
```

### Registry Issues
```bash
# Test carrier detection manually
node -e "const env = require('./test-setup').setupTestEnvironment(); console.log(env.trackerRegistry.detectCarrier('9405536106193298175824'))"
```

## 📊 Test Coverage

**Carriers Tested:**
- ✅ USPS (22-digit patterns, Express Mail)
- ✅ UPS (1Z format, Express, Ground)  
- ✅ FedEx (Multiple digit patterns with USPS exclusions)
- ✅ DHL (Various international formats)

**Edge Cases Covered:**
- Empty/null inputs
- Invalid formats
- Whitespace handling
- Case sensitivity
- Pattern conflicts (USPS vs FedEx)
- Duplicate registrations

**Real-World Validation:**
All tests use actual tracking numbers that were reported in user issues, ensuring real-world accuracy.

## 🛠 Maintenance

### Adding New Tests
1. Add test functions to appropriate test file
2. Use descriptive test names
3. Include both positive and negative test cases
4. Test edge cases and error conditions

### Adding New Carriers
1. Update `test-setup.js` to load new carrier file
2. Add carrier tests to `carrier-tests.js`
3. Update registry tests for new carrier count
4. Add test tracking numbers for the new carrier

### Updating Patterns
1. Verify patterns against actual tracking numbers
2. Update test data to match new patterns
3. Ensure FedEx exclusions still work for USPS numbers
4. Test pattern priority in registry

## 🏆 Test Quality Standards

- **Real Data**: Tests use actual tracking numbers from user reports
- **Comprehensive Coverage**: Tests positive cases, negative cases, and edge cases
- **Clear Assertions**: Each test has descriptive error messages
- **Isolated Tests**: No test dependencies or shared state
- **Performance**: All tests complete in under 10 seconds

This test suite ensures the package tracker works reliably for real-world usage patterns and prevents regressions when making changes to carrier detection logic. 