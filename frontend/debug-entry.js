// Debug entry point to see what expo-router is loading
console.log("[DEBUG ENTRY] ==========================================");
console.log("[DEBUG ENTRY] ========== ENTRY POINT START ==========");
console.log("[DEBUG ENTRY] ==========================================");
console.log("[DEBUG ENTRY] Platform:", require("react-native").Platform.OS);
console.log(
  "[DEBUG ENTRY] Environment:",
  __DEV__ ? "development" : "production"
);

// Check if we can directly require our app files
console.log("[DEBUG ENTRY] Attempting to directly require app/_layout.tsx...");
try {
  const Layout = require("./app/_layout.tsx");
  console.log("[DEBUG ENTRY] ✅ Successfully required app/_layout.tsx");
  console.log("[DEBUG ENTRY] Layout exports:", Object.keys(Layout));
  console.log("[DEBUG ENTRY] Layout.default type:", typeof Layout.default);
} catch (e) {
  console.log("[DEBUG ENTRY] ❌ Failed to require app/_layout.tsx:", e.message);
  console.log("[DEBUG ENTRY] Error stack:", e.stack);
}

console.log("[DEBUG ENTRY] Attempting to directly require app/index.tsx...");
try {
  const Index = require("./app/index.tsx");
  console.log("[DEBUG ENTRY] ✅ Successfully required app/index.tsx");
  console.log("[DEBUG ENTRY] Index exports:", Object.keys(Index));
  console.log("[DEBUG ENTRY] Index.default type:", typeof Index.default);
} catch (e) {
  console.log("[DEBUG ENTRY] ❌ Failed to require app/index.tsx:", e.message);
  console.log("[DEBUG ENTRY] Error stack:", e.stack);
}

// Check if expo-router can find routes
try {
  const ctx = require.context("./app", true, /\.(js|jsx|ts|tsx)$/);
  const keys = ctx.keys();
  console.log(
    "[DEBUG ENTRY] ✅ Found routes via require.context:",
    keys.length,
    "files"
  );
  console.log("[DEBUG ENTRY] First 5 route files:", keys.slice(0, 5));
} catch (e) {
  console.log("[DEBUG ENTRY] ❌ require.context failed:", e.message);
}

// Check what expo-router entry exports
console.log("[DEBUG ENTRY] Checking expo-router/entry exports...");
try {
  const expoRouterEntry = require("expo-router/entry");
  console.log("[DEBUG ENTRY] expo-router/entry type:", typeof expoRouterEntry);
  console.log(
    "[DEBUG ENTRY] expo-router/entry is null?:",
    expoRouterEntry === null
  );

  console.log(
    "[DEBUG ENTRY] expo-router/entry is undefined?:",
    expoRouterEntry === undefined
  );
  if (expoRouterEntry && typeof expoRouterEntry === "object") {
    console.log(
      "[DEBUG ENTRY] expo-router/entry keys:",
      Object.keys(expoRouterEntry)
    );
  }
} catch (e) {
  console.log("[DEBUG ENTRY] ❌ Failed to check expo-router/entry:", e.message);
}

// Now load the actual expo-router entry
console.log("[DEBUG ENTRY] ==========================================");
console.log("[DEBUG ENTRY] Loading expo-router/entry...");
console.log("[DEBUG ENTRY] ==========================================");

const entry = require("expo-router/entry");

console.log("[DEBUG ENTRY] ==========================================");
console.log("[DEBUG ENTRY] expo-router/entry loaded successfully");
console.log("[DEBUG ENTRY] Exporting entry module...");
console.log("[DEBUG ENTRY] ==========================================");

module.exports = entry;
