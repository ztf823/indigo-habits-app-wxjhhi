
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle node: protocol imports
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Handle node: protocol imports by stripping the prefix
    if (moduleName.startsWith('node:')) {
      const nodeModuleName = moduleName.replace(/^node:/, '');
      
      // For 'module', return an empty polyfill since it's not needed in React Native
      if (nodeModuleName === 'module') {
        return {
          type: 'empty',
        };
      }
      
      // For other node: imports, try to resolve without the prefix
      try {
        return context.resolveRequest(context, nodeModuleName, platform);
      } catch (e) {
        // If resolution fails, return empty
        return {
          type: 'empty',
        };
      }
    }
    
    // Default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
