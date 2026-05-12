// /**
//  * Auth Context
//  * 
//  * Global authentication state management
//  * Provides auth state and methods to all components
//  * 
//  * Usage:
//  * const { user, isAuthenticated, login, logout } = useAuth();
//  */

// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { getAccessToken, getUserData, clearAuthData, saveTokens, saveUserData } from '../utils/storage';

// const AuthContext = createContext({});

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   // Check authentication status on mount
//   useEffect(() => {
//     checkAuthStatus();
//   }, []);

//   const checkAuthStatus = async () => {
//     try {
//       const token = await getAccessToken();
//       const userData = await getUserData();

//       if (token && userData) {
//         setUser(userData);
//         setIsAuthenticated(true);
//       }
//     } catch (error) {
//       console.error('Error checking auth status:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const login = async (accessToken, refreshToken, userData) => {
//     try {
//       await saveTokens(accessToken, refreshToken);
//       await saveUserData(userData);
//       setUser(userData);
//       setIsAuthenticated(true);
//     } catch (error) {
//       console.error('Error during login:', error);
//       throw error;
//     }
//   };

//   const logout = async () => {
//     try {
//       await clearAuthData();
//       setUser(null);
//       setIsAuthenticated(false);
//     } catch (error) {
//       console.error('Error during logout:', error);
//       throw error;
//     }
//   };

//   const updateUser = async (updatedUserData) => {
//     try {
//       await saveUserData(updatedUserData);
//       setUser(updatedUserData);
//     } catch (error) {
//       console.error('Error updating user:', error);
//       throw error;
//     }
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         isAuthenticated,
//         isLoading,
//         login,
//         logout,
//         updateUser,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook to use auth context
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within AuthProvider');
//   }
//   return context;
// };

// export default AuthContext;
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { getAccessToken, getUserData, clearAuthData, saveTokens, saveUserData } from '../utils/storage';

// const AuthContext = createContext({});

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     checkAuthStatus();
//   }, []);

//   const checkAuthStatus = async () => {
//     try {
//       const token = await getAccessToken();
//       const userData = await getUserData();

//       if (token && userData) {
//         setUser(userData);
//         setIsAuthenticated(true);
//       }
//     } catch (error) {
//       console.error('Auth check error:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const login = async (accessToken, refreshToken, userData) => {
//     await saveTokens(accessToken, refreshToken);
//     await saveUserData(userData);
//     setUser(userData);
//     setIsAuthenticated(true);
//   };

//   const logout = async () => {
//     await clearAuthData();
//     setUser(null);
//     setIsAuthenticated(false);
//   };

//   const updateUser = async (updatedUserData) => {
//     await saveUserData(updatedUserData);
//     setUser(updatedUserData);
//   };

//   // ✅ ROLE FLAGS
//   const isAdmin = user?.role === 'admin';
//   const isVendor = user?.role === 'vendor';
//   const isCustomer = user?.role === 'customer';

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         isAuthenticated,
//         isLoading,
//         isAdmin,
//         isVendor,
//         isCustomer,
//         login,
//         logout,
//         updateUser,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// export default AuthContext;


/**
 * AuthContext.js
 *
 * Added: isServiceVendor flag
 * Requires: user object from login response includes vendor_type field.
 * Backend should return vendor_type in the user object on login/signup.
 *
 * Usage:
 *   const { user, isAuthenticated, isVendor, isServiceVendor, login, logout } = useAuth();
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAccessToken, getUserData, clearAuthData, saveTokens, saveUserData } from '../utils/storage';
import { logoutApi } from '../api/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getAccessToken();
      const userData = await getUserData();
      if (token && userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (accessToken, refreshToken, userData) => {
    console.log('🔐 AuthContext.login called');
    console.log('   accessToken:', accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING');
    console.log('   refreshToken:', refreshToken ? 'exists' : 'MISSING');
    console.log('   user:', userData);

    await saveTokens(accessToken, refreshToken);
    await saveUserData(userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    // Revoke token on backend first (fire-and-forget — always clear local state)
    await logoutApi();
    await clearAuthData();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (updatedUserData) => {
    await saveUserData(updatedUserData);
    setUser(updatedUserData);
  };

  // ── Role flags ─────────────────────────────────────────
  const isAdmin = user?.role === 'admin';
  const isVendor = user?.role === 'vendor';
  const isCustomer = user?.role === 'customer';

  // ✅ Service vendor: role is "vendor" AND vendor_type is "service"
  // Requires backend to include vendor_type in the login/signup user object.
  // If vendor_type is not yet in the response, this safely defaults to false.
  const isServiceVendor = user?.role === 'vendor' && user?.vendor_type === 'service';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        isVendor,
        isCustomer,
        isServiceVendor,   // ✅ NEW
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;