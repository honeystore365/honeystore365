// jest.polyfills.js
/**
 * @note The block below contains polyfills for Node.js globals
 * required for Jest to run in a Node.js environment.
 * @see https://jestjs.io/docs/webpack#handling-static-assets
 */

const { TextEncoder, TextDecoder } = require('util');

Object.assign(global, { TextDecoder, TextEncoder });

// JSDOM's BroadcastChannel implementation is not complete.
// Force the broadcast-channel module to use the 'node' method.
// @see https://github.com/pubkey/broadcast-channel/issues/433
const { enforceOptions } = require('broadcast-channel');
enforceOptions({
  type: 'node',
});

// After enforcing the node-based implementation, we can expose it globally.
global.BroadcastChannel = require('broadcast-channel').BroadcastChannel;
