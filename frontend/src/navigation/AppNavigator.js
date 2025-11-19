import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { View, Text, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

// Placeholder home screen (replace with your actual app)
const HomeScreen = () => {
  const { logout } = useAuth();
  
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.homeText}>Welcome to EAIN!</Text>
      <Text style={styles.homeSubtext}>You are logged in</Text>
    </View>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  homeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  homeSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default AppNavigator;

