import '@testing-library/jest-dom';

// Global test setup
// This ensures Jest DOM matchers are available in all tests 

// Add any global test setup here 

// Add any additional testing setup that might be needed
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Run cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
}); 