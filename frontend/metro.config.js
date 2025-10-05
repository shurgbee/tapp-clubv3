const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Enable unstable_allowRequireContext for expo-router
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Custom resolver to redirect expo-router/_ctx to our custom override
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect expo-router/_ctx to our custom implementation that uses relative paths
  if (moduleName === "expo-router/_ctx") {
    console.log("[METRO] Redirecting expo-router/_ctx to custom override");
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "_ctx-override.ts"),
    };
  }

  // Use default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
