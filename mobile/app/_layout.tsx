import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View, Text } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    try {
      // Force RTL out-of-the-box for beautiful Arabic presentation
      if (!I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      }
    } catch (e) {
      console.warn('RTL force loading failed:', e);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#1c1917" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1c1917',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerTitleAlign: 'center',
            contentStyle: {
              backgroundColor: '#fafaf9',
            },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerShown: false, 
              title: 'الرئيسية' 
            }} 
          />
          <Stack.Screen 
            name="login" 
            options={{ 
              title: 'تسجيل الدخول',
              headerShown: true,
              headerBackTitleVisible: false 
            }} 
          />
          <Stack.Screen 
            name="home" 
            options={{ 
              title: 'الرئيسية',
              headerShown: true,
              headerLeft: () => null // Prevent going back to login / index easily
            }} 
          />
          <Stack.Screen 
            name="booking" 
            options={{ 
              title: 'حجز رحلة جديدة',
              headerShown: true 
            }} 
          />
          <Stack.Screen 
            name="tracking" 
            options={{ 
              title: 'تتبع الشحنات والطرود',
              headerShown: true 
            }} 
          />
          <Stack.Screen 
            name="driver" 
            options={{ 
              title: 'لوحة السائق',
              headerShown: true 
            }} 
          />
          <Stack.Screen 
            name="admin" 
            options={{ 
              title: 'لوحة التحكم للمشرف',
              headerShown: true 
            }} 
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
