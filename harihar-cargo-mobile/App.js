import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ConverterProvider } from './src/context/ConverterContext';

// Clean Screen Imports
import LoginScreen from './src/screens/LoginScreen';
import PickupFormScreen from './src/screens/PickupFormScreen';
import BiltyFormScreen from './src/screens/BiltyFormScreen';
import DocumentHubScreen from './src/screens/DocumentHubScreen';
import LoadingFormScreen from './src/screens/LoadingFormScreen';


const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0f172a' },
        }}
      >
        {userToken == null ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="DocumentHub"
              component={DocumentHubScreen}
              options={{ title: 'Harihar Cargo Operations' }}
            />

            {/* // In Stack.Navigator: */}
<Stack.Screen
  name="PickupForm"
  component={PickupFormScreen}
  options={{ title: 'New Pickup Ticket' }}
/>
<Stack.Screen
  name="BiltyForm"
  component={BiltyFormScreen}
  options={{ title: 'Bilty (LR) Entry' }}
/>
<Stack.Screen name="LoadingForm" component={LoadingFormScreen} options={{ title: 'Loading Slip Entry' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ConverterProvider>
        <RootNavigator />
      </ConverterProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});