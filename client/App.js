

/**
 * App.js - Main Entry Point
 *
 * Root component that wraps the entire app
 * - Sets up navigation
 * - Provides Redux store
 * - Provides auth context
 * - Handles gesture handler setup
 */

import React from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import store from './src/redux/store'; // ya './redux/store' (tumhare folder structure ke hisaab se)
import './src/translations';


export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AuthProvider>
            <AppNavigator />
            <StatusBar style="dark" />
          </AuthProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
