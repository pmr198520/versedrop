import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { colors, type } from './theme';
import { useAuthStore } from './store/authStore';
import { useLocation } from './hooks/useLocation';
import { usePushRegistration } from './hooks/usePushRegistration';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

import MapScreen from './screens/MapScreen';
import LibraryScreen from './screens/LibraryScreen';
import ProfileScreen from './screens/ProfileScreen';
import DropComposerScreen from './screens/DropComposerScreen';
import OnboardingScreen from './screens/OnboardingScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.gold,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.separator,
    notification: colors.gold,
  },
};

type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  DropComposer: undefined;
};

type TabParamList = {
  Map: undefined;
  Library: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Map:     { active: 'map',       inactive: 'map-outline' },
  Library: { active: 'book',      inactive: 'book-outline' },
  Profile: { active: 'person',    inactive: 'person-outline' },
};

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        tint="dark"
        intensity={80}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15,15,18,0.55)' }]}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.bg }]} />;
}

function MainTabs() {
  const screenOptions: (args: { route: { name: keyof TabParamList } }) => BottomTabNavigationOptions = ({ route }) => ({
    headerShown: false,
    tabBarBackground: () => <TabBarBackground />,
    tabBarStyle: {
      position: 'absolute',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      elevation: 0,
      shadowOpacity: 0,
      height: Platform.OS === 'ios' ? 86 : 70,
      paddingTop: 8,
    },
    tabBarLabelStyle: { ...type.caption2, marginTop: 4 },
    tabBarActiveTintColor: colors.gold,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarIcon: ({ focused, color, size }) => {
      const name = TAB_ICONS[route.name][focused ? 'active' : 'inactive'];
      return <Ionicons name={name} size={size ?? 24} color={color} />;
    },
  });

  return (
    <Tab.Navigator screenOptions={screenOptions as any}>
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarAccessibilityLabel: 'Map tab' }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarAccessibilityLabel: 'Library tab' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarAccessibilityLabel: 'Profile tab' }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const isReady = useAuthStore((s) => s.isReady);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  useLocation();
  usePushRegistration();

  if (!isReady) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <NavigationContainer theme={NavTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!hasOnboarded && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="DropComposer"
            component={DropComposerScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <AppContent />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
});
