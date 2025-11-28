/**
 * App Navigator
 * 
 * React Navigation setup with all screens
 * Uses Stack Navigator for screen transitions
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import SplashScreen from '../screens/SplashScreen';
import PhoneNumberScreen from '../screens/PhoneNumberScreen';
import OTPScreen from '../screens/OTPScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BusinessRegistration from '../screens/BusinessRegistration';
import VendorDashboard from '../screens/VendorDashboard';
import AddProduct from '../screens/AddProduct';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="BusinessRegistration" component={BusinessRegistration} />
        <Stack.Screen name="VendorDashboard" component={VendorDashboard} />
         <Stack.Screen name="AddProduct" component={AddProduct} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
