import "dotenv/config";

export default {
  "expo": {
    "name": "Almaleek",
    "slug": "almaleek",
    "owner": "almaleek",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/logo.png",
    "scheme": "almaleek",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.almaleek.app",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Allow Almaleek to access your photos to upload product images.",
        "NSCameraUsageDescription": "Allow Almaleek to use your camera to upload product images.",
        "NSFaceIDUsageDescription": "Allow Almaleek to use Face ID for secure login."
      }
    },
    "android": {
      "package": "com.almaleek.app",
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        "backgroundColor": "#FFFFFF",
        "foregroundImage": "./assets/images/logo.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-notifications",
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Almaleek to access your photos to upload product images.",
          "cameraPermission": "Allow Almaleek to use your camera to upload product images.",
          "microphonePermission": false
        }
      ],
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/logo.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "de06eba4-a84a-4d92-8a27-a613dc7702d8"
      }
    }
  }
}
