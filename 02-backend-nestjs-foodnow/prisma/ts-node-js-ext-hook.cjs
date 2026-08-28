/**
 * The Prisma 7 generated client (src/generated/prisma/**) uses NodeNext-style
 * relative imports with explicit ".js" extensions pointing at sibling ".ts"
 * files (e.g. require('./internal/class.js')). ts-node's classic CommonJS
 * resolver doesn't remap that the way tsc's NodeNext resolution or Jest's
 * moduleNameMapper (see package.json's jest config) does. This hook falls
 * back to the ".ts" file when the literal ".js" path can't be resolved, so
 * `ts-node --transpile-only prisma/seed.ts` can load the generated client
 * without switching the whole project's module resolution.
 */
const Module = require('module');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith('.') && request.endsWith('.js')) {
    try {
      return originalResolve.call(this, request, ...rest);
    } catch (err) {
      return originalResolve.call(this, request.slice(0, -3), ...rest);
    }
  }
  return originalResolve.call(this, request, ...rest);
};
