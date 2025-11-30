
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

// // const AppNavigator = () => {
// //   const { isAuthenticated, isLoading, user } = useAuth();

// //   if (isLoading) {
// //     return (
// //       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
// //         <ActivityIndicator size="large" color="#89B5A8" />
// //       </View>
// //     );
// //   }

// //   return (
// //     <NavigationContainer>
// //       <Stack.Navigator
// //         initialRouteName="Splash"
// //         screenOptions={{
// //           headerShown: false,
// //           gestureEnabled: true,
// //         }}
// //       >
// //         {/* ✅ Splash Screen - Always first */}
// //         <Stack.Screen name="Splash" component={SplashScreen} />

// //         {/* ✅ Always accessible screens */}
// //         <Stack.Screen name="Home" component={HomeScreen} />
// //         <Stack.Screen name="Profile" component={ProfileScreen} />

// //         {/* ✅ Auth Screens */}
// //         <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
// //         <Stack.Screen name="OTP" component={OTPScreen} />
// //         <Stack.Screen name="SignUp" component={SignUpScreen} />
// //         <Stack.Screen name="Login" component={LoginScreen} />

// //         {/* ✅ Vendor Screens */}
// //         <Stack.Screen name="BusinessRegistration" component={BusinessRegistration} />
// //         <Stack.Screen name="VendorDashboard" component={VendorDashboard} />
// //         <Stack.Screen name="AddProduct" component={AddProduct} />
// //         <Stack.Screen name="MyProducts" component={MyProducts} />
// //         <Stack.Screen name="VendorInfo" component={VendorInfo} />
// //         <Stack.Screen name="SupportInfo" component={SupportInfo} />
// //       </Stack.Navigator>
// //     </NavigationContainer>
// //   );
// // };

// // export default AppNavigator;
// const AppNavigator = () => {
//   const { isLoading } = useAuth(); // user, isAuthenticated are used in screens

//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#036c5f" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         initialRouteName="Splash"
//         screenOptions={{ headerShown: false }}
//       >
//         {/* Splash always first */}
//         <Stack.Screen name="Splash" component={SplashScreen} />

//         {/* Public / main flow */}
//         <Stack.Screen name="Home" component={HomeScreen} />
//         <Stack.Screen name="Profile" component={ProfileScreen} />

//         {/* Auth */}
//         <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
//         <Stack.Screen name="OTP" component={OTPScreen} />
//         <Stack.Screen name="SignUp" component={SignUpScreen} />
//         <Stack.Screen name="Login" component={LoginScreen} />

//         {/* Vendor */}
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

// Existing Screens
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
import ProductDetailScreen from '../screens/ProductDetailScreen';
import VendorOrdersScreen from '../screens/VendorOrdersScreen';

// Customer Screens
import CustomerProductScreen from '../screens/customer/CustomerProductScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import MyOrdersScreen from '../screens/customer/MyOrdersScreen';
import OrderDetailsScreen from '../screens/customer/OrderDetailsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#036c5f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen name="CustomerProduct" component={CustomerProductScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />

        <Stack.Screen name="BusinessRegistration" component={BusinessRegistration} />
        <Stack.Screen name="VendorDashboard" component={VendorDashboard} />
        <Stack.Screen name="AddProduct" component={AddProduct} />
        <Stack.Screen name="MyProducts" component={MyProducts} />
        <Stack.Screen name="VendorInfo" component={VendorInfo} />
        <Stack.Screen name="SupportInfo" component={SupportInfo} />
        <Stack.Screen name="VendorProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="VendorOrders" component={VendorOrdersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
