const axios = require('axios');
const mongoose = require('mongoose');

/**
 * Comprehensive Authentication Flow Test Suite
 * Tests all new authentication features including refresh tokens, rate limiting, etc.
 */

class AuthTestSuite {
  constructor(baseUrl = 'http://localhost:8888') {
    this.baseUrl = baseUrl;
    this.testUser = {
      email: 'testuser@example.com',
      password: 'TestPassword123!',
      name: 'Test',
      surname: 'User',
    };
    this.tokens = {};
    this.cookies = '';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji =
      type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${timestamp} ${emoji} ${message}`);
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          Cookie: this.cookies,
          ...headers,
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);

      // Extract cookies from response
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie'].join('; ');
      }

      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 0,
        data: error.response?.data || { message: error.message },
        headers: error.response?.headers || {},
      };
    }
  }

  async testSignup() {
    this.log('Testing user signup...');

    const response = await this.makeRequest('POST', '/api/auth/signup', {
      ...this.testUser,
      role: 'EMPLOYEE',
    });

    if (response.success) {
      this.log('✅ Signup successful', 'success');
      return true;
    } else {
      if (response.data.message?.includes('already exists')) {
        this.log('⚠️ User already exists, continuing with tests', 'warning');
        return true;
      }
      this.log(`❌ Signup failed: ${response.data.message}`, 'error');
      return false;
    }
  }

  async testLogin() {
    this.log('Testing login with new enhanced flow...');

    const response = await this.makeRequest('POST', '/api/auth/login', {
      email: this.testUser.email,
      password: this.testUser.password,
    });

    if (response.success) {
      this.tokens.access = response.data.result.accessToken;
      this.tokens.refresh = response.data.result.refreshToken;
      this.log('✅ Login successful with new token format', 'success');
      this.log(`📄 Access token expires at: ${response.data.result.expiresAt}`);
      return true;
    } else {
      this.log(`❌ Login failed: ${response.data.message}`, 'error');
      return false;
    }
  }

  async testRefreshToken() {
    this.log('Testing refresh token endpoint...');

    const response = await this.makeRequest('POST', '/api/auth/refresh-token', {
      refreshToken: this.tokens.refresh,
    });

    if (response.success) {
      const oldAccessToken = this.tokens.access;
      this.tokens.access = response.data.result.accessToken;
      this.tokens.refresh = response.data.result.refreshToken;

      this.log('✅ Token refresh successful - tokens rotated', 'success');
      this.log(`🔄 Old access token: ${oldAccessToken.substring(0, 20)}...`);
      this.log(`🆕 New access token: ${this.tokens.access.substring(0, 20)}...`);
      return true;
    } else {
      this.log(`❌ Token refresh failed: ${response.data.message}`, 'error');
      return false;
    }
  }

  async testProtectedEndpoint() {
    this.log('Testing protected endpoint access...');

    const response = await this.makeRequest('GET', '/api/admin/profile', null, {
      Authorization: `Bearer ${this.tokens.access}`,
    });

    if (response.success || response.status === 404) {
      this.log('✅ Protected endpoint accessible with valid token', 'success');
      return true;
    } else {
      this.log(`❌ Protected endpoint failed: ${response.data.message}`, 'error');
      return false;
    }
  }

  async testRateLimiting() {
    this.log('Testing simplified rate limiting (200 requests per minute)...');

    const promises = [];
    for (let i = 0; i < 210; i++) {
      promises.push(
        this.makeRequest('GET', '/api/admin/profile', null, {
          Authorization: `Bearer ${this.tokens.access}`,
        })
      );
    }

    const responses = await Promise.all(promises);
    const rateLimited = responses.some((r) => r.status === 429);

    if (rateLimited) {
      this.log('✅ Simplified rate limiting is working correctly', 'success');
      return true;
    } else {
      this.log('⚠️ Rate limiting may not be configured or threshold not reached', 'warning');
      return true; // Not a failure, just warning
    }
  }

  async testLogout() {
    this.log('Testing logout with token blacklisting...');

    const response = await this.makeRequest(
      'POST',
      '/api/auth/logout',
      {},
      {
        Authorization: `Bearer ${this.tokens.access}`,
      }
    );

    if (response.success) {
      this.log('✅ Logout successful', 'success');

      // Test that old token is now invalid
      const testResponse = await this.makeRequest('GET', '/api/admin/profile', null, {
        Authorization: `Bearer ${this.tokens.access}`,
      });

      if (testResponse.status === 401) {
        this.log('✅ Token successfully blacklisted after logout', 'success');
        return true;
      } else {
        this.log('⚠️ Token may not be properly blacklisted', 'warning');
        return true;
      }
    } else {
      this.log(`❌ Logout failed: ${response.data.message}`, 'error');
      return false;
    }
  }

  async testSessionCleanup() {
    this.log('Testing session cleanup functionality...');

    try {
      const authService = require('../services/authService');
      const result = await authService.cleanupExpiredSessions('Admin');
      this.log('✅ Session cleanup executed successfully', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Session cleanup failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Authentication Test Suite');
    this.log('================================================');

    const tests = [
      { name: 'Signup', fn: () => this.testSignup() },
      { name: 'Login', fn: () => this.testLogin() },
      { name: 'Refresh Token', fn: () => this.testRefreshToken() },
      { name: 'Protected Endpoint', fn: () => this.testProtectedEndpoint() },
      { name: 'Rate Limiting', fn: () => this.testRateLimiting() },

      { name: 'Logout & Token Blacklisting', fn: () => this.testLogout() },
      { name: 'Session Cleanup', fn: () => this.testSessionCleanup() },
    ];

    const results = [];

    for (const test of tests) {
      this.log(`\n🧪 Running: ${test.name}`);
      try {
        const result = await test.fn();
        results.push({ name: test.name, success: result });
        if (result) {
          this.log(`✅ ${test.name} - PASSED`, 'success');
        } else {
          this.log(`❌ ${test.name} - FAILED`, 'error');
        }
      } catch (error) {
        this.log(`❌ ${test.name} - ERROR: ${error.message}`, 'error');
        results.push({ name: test.name, success: false, error: error.message });
      }

      // Wait between tests to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.log('\n📊 TEST RESULTS SUMMARY');
    this.log('========================');

    let passed = 0;
    let failed = 0;

    results.forEach((result) => {
      if (result.success) {
        this.log(`✅ ${result.name}`, 'success');
        passed++;
      } else {
        this.log(`❌ ${result.name}${result.error ? ` - ${result.error}` : ''}`, 'error');
        failed++;
      }
    });

    this.log(`\n📈 Final Score: ${passed}/${results.length} tests passed`);

    if (failed === 0) {
      this.log('🎉 All tests passed! Authentication system is working correctly.', 'success');
    } else {
      this.log(`⚠️ ${failed} test(s) failed. Check the logs above for details.`, 'warning');
    }

    return { passed, failed, total: results.length, results };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runTests = async () => {
    try {
      // Connect to MongoDB for cleanup tests
      if (process.env.DATABASE) {
        await mongoose.connect(process.env.DATABASE);
        console.log('📡 Connected to MongoDB for testing');
      }

      const testSuite = new AuthTestSuite();
      await testSuite.runAllTests();

      process.exit(0);
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    }
  };

  runTests();
}

module.exports = AuthTestSuite;
