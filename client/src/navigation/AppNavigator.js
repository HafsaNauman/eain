// import React from 'react';
// import { View, ActivityIndicator } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { useAuth } from '../context/AuthContext';

// // Screens
// import SplashScreen from '../screens/SplashScreen';
// import PhoneNumberScreen from '../screens/PhoneNumberScreen';
// import OTPScreen from '../screens/OTPScreen';
// import SignUpScreen from '../screens/SignUpScreen';
// import LoginScreen from '../screens/LoginScreen';
// import HomeScreen from '../screens/HomeScreen';
// import ProfileScreen from '../screens/ProfileScreen';
// import BusinessRegistration from '../screens/BusinessRegistration';
// import VendorDashboard from '../screens/VendorDashboard';
// import AddProduct from '../screens/AddProduct';
// import MyProducts from '../screens/MyProducts';
// import VendorInfo from '../screens/VendorInfo';
// import SupportInfo from '../screens/SupportInfo';

// const Stack = createStackNavigator();

// const AppNavigator = () => {
//   const { isAuthenticated, isLoading, user } = useAuth();

//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
//         <ActivityIndicator size="large" color="#14b8a6" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator 
//         initialRouteName="Home"
//         screenOptions={{ headerShown: false }}
//       >
//         {/* Always accessible screens */}
//         <Stack.Screen name="Home" component={HomeScreen} />
//         <Stack.Screen name="Profile" component={ProfileScreen} />

//         {/* Auth Screens */}
//         <Stack.Screen name="Splash" component={SplashScreen} />
//         <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
//         <Stack.Screen name="OTP" component={OTPScreen} />
//         <Stack.Screen name="SignUp" component={SignUpScreen} />
//         <Stack.Screen name="Login" component={LoginScreen} />

//         {/* Authenticated Screens */}
//         <Stack.Screen name="BusinessRegistration" component={BusinessRegistration} />
//         <Stack.Screen name="VendorDashboard" component={VendorDashboard} />
//         <Stack.Screen name="AddProduct" component={AddProduct} />
//         <Stack.Screen name="MyProducts" component={MyProducts} />
//         <Stack.Screen name="VendorInfo" component={VendorInfo} />
//         <Stack.Screen name="SupportInfo" component={SupportInfo} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default AppNavigator;


import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

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
import MyProducts from '../screens/MyProducts';
import VendorInfo from '../screens/VendorInfo';
import SupportInfo from '../screens/SupportInfo';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#89B5A8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        {/* ✅ Splash Screen - Always first */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* ✅ Always accessible screens */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* ✅ Auth Screens */}
        <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* ✅ Vendor Screens */}
        <Stack.Screen name="BusinessRegistration" component={BusinessRegistration} />
        <Stack.Screen name="VendorDashboard" component={VendorDashboard} />
        <Stack.Screen name="AddProduct" component={AddProduct} />
        <Stack.Screen name="MyProducts" component={MyProducts} />
        <Stack.Screen name="VendorInfo" component={VendorInfo} />
        <Stack.Screen name="SupportInfo" component={SupportInfo} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
