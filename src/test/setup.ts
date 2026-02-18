// autoloan-nextjs-metafullstack/src/test/setup.ts
import '@testing-library/jest-dom';

// Suppress known MUI + jsdom warnings that don't affect test correctness
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: Parameters<typeof console.warn>) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('anchorEl') || msg.includes('MUI')) return;
  originalWarn(...args);
};

console.error = (...args: Parameters<typeof console.error>) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('not wrapped in act') || msg.includes('anchorEl') || msg.includes('MUI')) return;
  originalError(...args);
};
