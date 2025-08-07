import 'react-native-url-polyfill/auto';
global.Buffer = require('buffer').Buffer;
import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

renderRootComponent(App);

