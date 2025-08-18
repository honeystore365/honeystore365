import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Polyfill for Node.js environment
if (typeof window === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers);