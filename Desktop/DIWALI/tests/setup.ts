import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Stub window.scrollTo for JSDOM
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
}

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
