// utils/validations.js
exports.validatePANandGSTIN = (pan, gstin, stateCode, legalStatus) => {
    const errors = [];
  
    // 1. GSTIN positions 3–12 should match PAN
    if (gstin && pan && gstin.substring(2, 12) !== pan.toUpperCase()) {
      errors.push('GSTIN digits 3–12 must match PAN.');
    }
  
    // 2. First 2 digits of GSTIN must match state code
    if (gstin && stateCode && gstin.substring(0, 2) !== stateCode) {
      errors.push('First 2 digits of GSTIN must match selected state code.');
    }
  
    // 3. PAN 4th character must match legal status
    const panLegalMap = {
      P: 'Individual',
      F: 'Partnership',
      C: 'Company',
      H: 'HUF',
      A: 'AOP',
      T: 'Trust',
    };
  
    const expectedStatus = panLegalMap[pan?.charAt(3)];
    if (expectedStatus && expectedStatus !== legalStatus) {
      errors.push(`PAN 4th character does not match legal status. Expected: ${expectedStatus}`);
    }
  
    return errors;
  };
  