import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.healthplanet.app',
  appName: '野兽俱乐部',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      signingType: 'apk',
    },
  },
};

export default config;
