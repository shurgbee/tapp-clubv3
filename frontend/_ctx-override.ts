// Custom context override for expo-router
// This fixes the issue where expo-router uses absolute paths but Metro's require.context needs relative paths

console.log("[CTX OVERRIDE] Loading custom context with relative path...");

// Use relative path instead of absolute path from EXPO_ROUTER_APP_ROOT
export const ctx = require.context(
  "./app",
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)))\.[tj]sx?$).*\.[tj]sx?$/
);

console.log(
  "[CTX OVERRIDE] Context created, keys:",
  ctx.keys().length,
  "files"
);
