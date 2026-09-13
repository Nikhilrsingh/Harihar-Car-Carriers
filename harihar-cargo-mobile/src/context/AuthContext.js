import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

// Define fine-grained permissions for Harihar Cargo
const ROLE_PERMISSIONS = {
  admin: {
    canCreatePickup: true,
    canCreateBilty: true,
    canCreateLoading: true,
    canCreateInvoice: true,
    canViewInvoices: true,
    canEditSettings: true,
  },
  manager: {
    canCreatePickup: true,
    canCreateBilty: true,
    canCreateLoading: true,
    canCreateInvoice: false,
    canViewInvoices: true,
    canEditSettings: false,
  },
  driver: {
    canCreatePickup: false,
    canCreateBilty: false,
    canCreateLoading: false,
    canCreateInvoice: false,
    canViewInvoices: false,
    canEditSettings: false,
  },
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' | 'manager' | 'driver'
  const [userData, setUserData] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      let role = 'driver';
      if (email.includes('admin')) role = 'admin';
      else if (email.includes('manager')) role = 'manager';

      const mockUser = { email, name: 'Harihar Cargo Team' };
      const mockToken = 'jwt-harihar-token-123';

      await AsyncStorage.setItem('userToken', mockToken);
      await AsyncStorage.setItem('userRole', role);
      await AsyncStorage.setItem('userData', JSON.stringify(mockUser));

      setUserToken(mockToken);
      setUserRole(role);
      setUserData(mockUser);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.multiRemove(['userToken', 'userRole', 'userData']);
      setUserToken(null);
      setUserRole(null);
      setUserData(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem('userToken');
      let role = await AsyncStorage.getItem('userRole');
      let data = await AsyncStorage.getItem('userData');

      if (token) {
        setUserToken(token);
        setUserRole(role);
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Session fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.driver;

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        isLoading,
        userToken,
        userRole,
        userData,
        permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};