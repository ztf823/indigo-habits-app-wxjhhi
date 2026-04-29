// Shim for node:module — not available in React Native
module.exports = {
  createRequire: () => require,
};
