import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// PUBLIC / AUTH
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import PhoneNumberScreen from '../screens/PhoneNumberScreen';
import OTPScreen from '../screens/OTPScreen';
import BusinessRegistration from '../screens/BusinessRegistration';

// COMMON
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// CUSTOMER
import CustomerProductScreen from '../screens/customer/CustomerProductScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import MyOrdersScreen from '../screens/customer/MyOrdersScreen';
import OrderDetailsScreen from '../screens/customer/OrderDetailsScreen';
import VisualSearchScreen from '../screens/customer/VisualSearchScreen';
import PaymentScreen from '../screens/customer/PaymentScreen';
import OrderConfirmationScreen from '../screens/customer/OrderConfirmationScreen';

// VENDOR
import VendorDashboard from '../screens/VendorDashboard';
import VendorOrdersScreen from '../screens/VendorOrdersScreen';
import VendorOrderDetailScreen from '../screens/VendorOrderDetailScreen';
import ManageListingsScreen from '../screens/ManageListingsScreen';
import InventoryManagementScreen from '../screens/InventoryManagementScreen';
import AddProduct from '../screens/AddProduct';
import MyProducts from '../screens/MyProducts';
import VendorInfo from '../screens/VendorInfo';
import SupportInfo from '../screens/SupportInfo';
import ProductDetailScreen from '../screens/ProductDetailScreen';

// ADMIN
import AdminDashboard from '../screens/admin/AdminDashboard';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import VendorsManagementScreen from '../screens/admin/VendorsManagementScreen';
import ListingsManagementScreen from '../screens/admin/ListingsManagementScreen';

// SERVICE
import ServiceDashboardScreen from '../screens/ServiceDashboardScreen';
import ServiceBookingsScreen from '../screens/ServiceBookingsScreen';
import ServiceAvailabilityScreen from '../screens/ServiceAvailabilityScreen';
import ServiceProfileScreen from '../screens/ServiceProfileScreen';
import ServiceBrowse from '../screens/service/ServiceBrowse';
import ServiceProviderDetail from '../screens/service/ServiceProviderDetail';
import ServiceBookingForm from '../screens/service/ServiceBookingForm';
import MyBookings from '../screens/service/MyBookings';

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
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>

        {/* AUTH */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="BusinessRegistration" component={BusinessRegistration} />

        {/* COMMON */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* CUSTOMER */}
        <Stack.Screen name="CustomerProduct" component={CustomerProductScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="VisualSearch" component={VisualSearchScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />

        {/* VENDOR */}
        <Stack.Screen name="VendorDashboard" component={VendorDashboard} />
        <Stack.Screen name="VendorOrders" component={VendorOrdersScreen} />
        <Stack.Screen name="VendorOrderDetail" component={VendorOrderDetailScreen} />
        <Stack.Screen name="ManageListings" component={ManageListingsScreen} />
        <Stack.Screen name="InventoryManagement" component={InventoryManagementScreen} />
        <Stack.Screen name="AddProduct" component={AddProduct} />
        <Stack.Screen name="MyProducts" component={MyProducts} />
        <Stack.Screen name="VendorInfo" component={VendorInfo} />
        <Stack.Screen name="SupportInfo" component={SupportInfo} />
        <Stack.Screen name="VendorProductDetail" component={ProductDetailScreen} />

        {/* ADMIN */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="UsersManagement" component={UserManagementScreen} />
        <Stack.Screen name="VendorsManagement" component={VendorsManagementScreen} />
        <Stack.Screen name="ListingsManagement" component={ListingsManagementScreen} />

        {/* SERVICE */}
        <Stack.Screen name="ServiceDashboard" component={ServiceDashboardScreen} />
        <Stack.Screen name="ServiceBookings" component={ServiceBookingsScreen} />
        <Stack.Screen name="ServiceAvailability" component={ServiceAvailabilityScreen} />
        <Stack.Screen name="ServiceProfile" component={ServiceProfileScreen} />
        <Stack.Screen name="ServiceBrowse" component={ServiceBrowse} />
        <Stack.Screen name="ServiceProviderDetail" component={ServiceProviderDetail} />
        <Stack.Screen name="ServiceBookingForm" component={ServiceBookingForm} />
        <Stack.Screen name="MyBookings" component={MyBookings} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;