export default {
  expo: {
    name: "AcoustiCare",
    slug: "hypercase-app",
    extra: {
      BACKEND_URL: process.env.BACKEND_URL || "http://localhost:8000",
      eas: {
        projectId: "387087c0-8898-4dc2-a320-5609665d18cc",
      },
    },
    scripts: {
      lint: "expo lint",
    },
    newArchEnabled: true,
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.acousticare.app",
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      package: "com.acousticare.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/387087c0-8898-4dc2-a320-5609665d18cc",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "expo-audio",
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
