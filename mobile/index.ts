import { registerRootComponent } from 'expo';
import App from './App';

// NOTE: I18nManager.forceRTL() does NOT work in Expo Go on iOS
// To use I18nManager RTL, you need a development build (not Expo Go)
// Our app uses explicit RTL styling instead (flexDirection: 'row-reverse', textAlign: 'right', etc.)

registerRootComponent(App);
