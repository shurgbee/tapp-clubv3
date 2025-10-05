const {
  withAndroidManifest,
  AndroidConfig,
  withDangerousMod,
} = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

/**
 * Expo config plugin for react-native-hce
 * Automatically configures Android HCE (Host Card Emulation) support
 */
const withReactNativeHce = (config) => {
  // Add Android permissions using AndroidConfig.Permissions.withPermissions
  config = AndroidConfig.Permissions.withPermissions(config, [
    "android.permission.NFC",
    "android.permission.BIND_NFC_SERVICE",
  ]);

  // Modify AndroidManifest.xml to add HCE service and feature
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add uses-feature for NFC HCE
    if (!androidManifest.manifest["uses-feature"]) {
      androidManifest.manifest["uses-feature"] = [];
    }

    const hceFeatureExists = androidManifest.manifest["uses-feature"].some(
      (feature) => feature.$["android:name"] === "android.hardware.nfc.hce"
    );

    if (!hceFeatureExists) {
      androidManifest.manifest["uses-feature"].push({
        $: {
          "android:name": "android.hardware.nfc.hce",
          "android:required": "true",
        },
      });
      console.log("✅ Added HCE feature declaration to AndroidManifest.xml");
    }

    // Check if the service already exists
    const existingService = mainApplication.service?.find(
      (service) =>
        service.$["android:name"] === "com.reactnativehce.services.CardService"
    );

    if (!existingService) {
      // Initialize service array if it doesn't exist
      if (!mainApplication.service) {
        mainApplication.service = [];
      }

      // Add HCE CardService
      mainApplication.service.push({
        $: {
          "android:name": "com.reactnativehce.services.CardService",
          "android:enabled": "false",
          "android:exported": "true",
          "android:permission": "android.permission.BIND_NFC_SERVICE",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name":
                    "android.nfc.cardemulation.action.HOST_APDU_SERVICE",
                },
              },
            ],
            category: [
              {
                $: {
                  "android:name": "android.intent.category.DEFAULT",
                },
              },
            ],
          },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.nfc.cardemulation.host_apdu_service",
              "android:resource": "@xml/aid_list",
            },
          },
        ],
      });

      console.log("✅ Added HCE CardService to AndroidManifest.xml");
    }

    return config;
  });

  // Create aid_list.xml file using withDangerousMod
  config = withAidListXml(config);

  return config;
};

/**
 * Create aid_list.xml file in res/xml directory
 * Uses withDangerousMod to write files during prebuild
 */
const withAidListXml = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidResPath = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res"
      );
      const xmlDir = path.join(androidResPath, "xml");
      const aidListPath = path.join(xmlDir, "aid_list.xml");

      // Create xml directory if it doesn't exist
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Create aid_list.xml content
      const aidListContent = `<?xml version="1.0" encoding="utf-8"?>
<host-apdu-service xmlns:android="http://schemas.android.com/apk/res/android"
                   android:description="@string/app_name"
                   android:requireDeviceUnlock="false">
  <aid-group android:category="other"
             android:description="@string/app_name">
    <aid-filter android:name="D2760000850101" />
  </aid-group>
</host-apdu-service>
`;

      // Write the file
      fs.writeFileSync(aidListPath, aidListContent, "utf-8");
      console.log("✅ Created aid_list.xml for HCE configuration");

      return config;
    },
  ]);
};

module.exports = withReactNativeHce;
