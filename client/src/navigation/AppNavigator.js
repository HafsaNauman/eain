

// import React from 'react';
// import { View, ActivityIndicator } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { useAuth } from '../context/AuthContext';

// // Existing Screens
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
// import ProductDetailScreen from '../screens/ProductDetailScreen';
// import VendorOrdersScreen from '../screens/VendorOrdersScreen';
// import VendorOrderDetailScreen from '../screens/VendorOrderDetailScreen'; // ya jahan tumne banaya ho
// import CartScreen from '../screens/customer/CartScreen';
// import ManageListingsScreen from '../screens/ManageListingsScreen';
// import InventoryManagementScreen from '../screens/InventoryManagementScreen';

// // Customer Screens
// import CustomerProductScreen from '../screens/customer/CustomerProductScreen';
// import CheckoutScreen from '../screens/customer/CheckoutScreen';
// import MyOrdersScreen from '../screens/customer/MyOrdersScreen';
// import OrderDetailsScreen from '../screens/customer/OrderDetailsScreen';
// import VisualSearchScreen from '../screens/customer/VisualSearchScreen';

// const Stack = createStackNavigator();

// const AppNavigator = () => {
//   const { isLoading } = useAuth();

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
//         <Stack.Screen name="Splash" component={SplashScreen} />
//         <Stack.Screen name="Home" component={HomeScreen} />
//         <Stack.Screen name="Profile" component={ProfileScreen} />

//         <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
//         <Stack.Screen name="OTP" component={OTPScreen} />
//         <Stack.Screen name="SignUp" component={SignUpScreen} />
//         <Stack.Screen name="Login" component={LoginScreen} />

//         <Stack.Screen name="CustomerProduct" component={CustomerProductScreen} />
//         <Stack.Screen name="Checkout" component={CheckoutScreen} />
//         <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
//         <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
//         <Stack.Screen name="Cart" component={CartScreen} />
//         <Stack.Screen name="VisualSearch" component={VisualSearchScreen} />

//         <Stack.Screen name="BusinessRegistration" component={BusinessRegistration} />
//         <Stack.Screen name="VendorDashboard" component={VendorDashboard} />
//         <Stack.Screen name="AddProduct" component={AddProduct} />
//         <Stack.Screen name="MyProducts" component={MyProducts} />
//         <Stack.Screen name="VendorInfo" component={VendorInfo} />
//         <Stack.Screen name="SupportInfo" component={SupportInfo} />
//         <Stack.Screen name="VendorProductDetail" component={ProductDetailScreen} />
//         <Stack.Screen name="VendorOrders" component={VendorOrdersScreen} />
//         <Stack.Screen name="VendorOrderDetail" component={VendorOrderDetailScreen} />
//         <Stack.Screen name="ManageListings" component={ManageListingsScreen} />
//         <Stack.Screen name="InventoryManagement" component={InventoryManagementScreen} />

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
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Vendor/Admin Shared
import VendorDashboard from '../screens/VendorDashboard';
import VendorOrdersScreen from '../screens/VendorOrdersScreen';
import VendorOrderDetailScreen from '../screens/VendorOrderDetailScreen';
import ManageListingsScreen from '../screens/ManageListingsScreen';
import InventoryManagementScreen from '../screens/InventoryManagementScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import UsersManagementScreen from '../screens/admin/UsersManagementScreen'; 
import VendorsManagementScreen from '../screens/admin/VendorsManagementScreen';
import ListingsManagementScreen from '../screens/admin/ListingsManagementScreen';

// Customer
import CustomerProductScreen from '../screens/customer/CustomerProductScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isLoading, isAdmin, isVendor, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#036c5f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* Public */}
        {!isAuthenticated && (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}

        {/* Customer */}
        {isAuthenticated && !isAdmin && !isVendor && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CustomerProduct" component={CustomerProductScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
          </>
        )}

        {/* Vendor */}
        {isVendor && (
          <>
            <Stack.Screen name="VendorDashboard" component={VendorDashboard} />
            <Stack.Screen name="VendorOrders" component={VendorOrdersScreen} />
            <Stack.Screen name="VendorOrderDetail" component={VendorOrderDetailScreen} />
            <Stack.Screen name="ManageListings" component={ManageListingsScreen} />
            <Stack.Screen name="InventoryManagement" component={InventoryManagementScreen} />
          </>
        )}

        {/* Admin (reuses vendor screens) */}
        {isAdmin && (
  <>
    <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    <Stack.Screen name="UsersManagement" component={UsersManagementScreen} />
    <Stack.Screen name="VendorsManagement" component={VendorsManagementScreen} />
    <Stack.Screen name="ListingsManagement" component={ListingsManagementScreen} />
    <Stack.Screen name="OrdersManagement" component={VendorOrdersScreen} /> {/* Reuse your screen! */}
  </>
)}


      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;