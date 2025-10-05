// Debug entry point to see what expo-router is loading
console.log("[DEBUG ENTRY] ==========================================");
console.log("[DEBUG ENTRY] ========== ENTRY POINT START ==========");
console.log("[DEBUG ENTRY] ==========================================");
console.log("[DEBUG ENTRY] Platform:", require("react-native").Platform.OS);
console.log(
  "[DEBUG ENTRY] Environment:",
  __DEV__ ? "development" : "production"
);

// Check critical environment variables
console.log("[DEBUG ENTRY] ==========================================");
console.log("[DEBUG ENTRY] CHECKING ENVIRONMENT VARIABLES:");
console.log(
  "[DEBUG ENTRY] process.env.EXPO_ROUTER_APP_ROOT:",
  process.env.EXPO_ROUTER_APP_ROOT
);
console.log(
  "[DEBUG ENTRY] process.env.EXPO_ROUTER_IMPORT_MODE:",
  process.env.EXPO_ROUTER_IMPORT_MODE
);
console.log("[DEBUG ENTRY] ==========================================");

// Check if we can directly require our app files
console.log("[DEBUG ENTRY] Attempting to directly require app/_layout.tsx...");
try {
  const Layout = require("./app/_layout.tsx");
  console.log("[DEBUG ENTRY] ✅ Successfully required app/_layout.tsx");
  console.log("[DEBUG ENTRY] Layout exports:", Object.keys(Layout));
  console.log("[DEBUG ENTRY] Layout.default type:", typeof Layout.default);
} catch (e) {
  console.log("[DEBUG ENTRY] ❌ Failed to require app/_layout.tsx:", e.message);
}

console.log("[DEBUG ENTRY] Attempting to directly require app/index.tsx...");
try {
  const Index = require("./app/index.tsx");
  console.log("[DEBUG ENTRY] ✅ Successfully required app/index.tsx");
  console.log("[DEBUG ENTRY] Index exports:", Object.keys(Index));
  console.log("[DEBUG ENTRY] Index.default type:", typeof Index.default);
} catch (e) {
  console.log("[DEBUG ENTRY] ❌ Failed to require app/index.tsx:", e.message);
}

// Check the context that expo-router will use
console.log("[DEBUG ENTRY] Checking expo-router/_ctx...");
try {
  const ctx = require("expo-router/_ctx");
  console.log("[DEBUG ENTRY] ✅ expo-router/_ctx loaded");
  console.log("[DEBUG ENTRY] ctx.ctx exists?:", !!ctx.ctx);
  console.log("[DEBUG ENTRY] ctx.ctx type:", typeof ctx.ctx);

  if (ctx.ctx) {
    console.log("[DEBUG ENTRY] ctx.ctx.keys type:", typeof ctx.ctx.keys);
    if (typeof ctx.ctx.keys === "function") {
      const keys = ctx.ctx.keys();
      console.log(
        "[DEBUG ENTRY] ctx.ctx.keys() returned:",
        keys.length,
        "files"
      );
      console.log("[DEBUG ENTRY] First 5 keys:", keys.slice(0, 5));

      if (keys.length === 0) {
        console.log(
          "[DEBUG ENTRY] ⚠️ WARNING: ctx.ctx.keys() returned 0 files!"
        );
        console.log(
          "[DEBUG ENTRY] This means EXPO_ROUTER_APP_ROOT might be wrong or require.context isn't working"
        );
      }
    }
  }
} catch (e) {
  console.log("[DEBUG ENTRY] ❌ Failed to load expo-router/_ctx:", e.message);
  console.log("[DEBUG ENTRY] Error:", e);
}

// Try manual require.context with explicit path
console.log("[DEBUG ENTRY] Testing manual require.context with './app'...");
try {
  const manualCtx = require.context("./app", true, /\.(js|jsx|ts|tsx)$/);
  const manualKeys = manualCtx.keys();
  console.log(
    "[DEBUG ENTRY] Manual require.context found:",
    manualKeys.length,
    "files"
  );
  console.log(
    "[DEBUG ENTRY] This proves require.context WORKS, so the issue is EXPO_ROUTER_APP_ROOT"
  );
} catch (e) {
  console.log("[DEBUG ENTRY] ❌ Manual require.context failed:", e.message);
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
