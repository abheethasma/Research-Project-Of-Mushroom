import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import EnvironmentScreen from './src/screens/environment/EnvironmentScreen';
import EnvironmentSolutionScreen from './src/screens/environment/EnvironmentSolutionScreen';
import EnvironmentForecastScreen from './src/screens/environment/EnvironmentForecastScreen';
import EnvironmentVarietyScreen from './src/screens/environment/EnvironmentVarietyScreen';
import DiseaseDetectionScreen from './src/screens/DiseaseDetectionScreen';
import GrowthPredictionScreen from './src/screens/GrowthPredictionScreen';
import MushroomTypeScreen from './src/screens/MushroomTypeScreen';

const Tab = createBottomTabNavigator();
const EnvironmentStack = createNativeStackNavigator();

function EnvironmentStackNavigator() {
  return (
    <EnvironmentStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#e5e7eb',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <EnvironmentStack.Screen
        name="EnvironmentHome"
        component={EnvironmentScreen}
        options={{ title: 'Environmental Monitoring' }}
      />
      <EnvironmentStack.Screen
        name="EnvironmentSolution"
        component={EnvironmentSolutionScreen}
        options={{ title: 'Solution Recommendation' }}
      />
      <EnvironmentStack.Screen
        name="EnvironmentForecast"
        component={EnvironmentForecastScreen}
        options={{ title: '60-Minute Forecast' }}
      />
      <EnvironmentStack.Screen
        name="EnvironmentVariety"
        component={EnvironmentVarietyScreen}
        options={{ title: 'Variety Recommendation' }}
      />
    </EnvironmentStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#e5e7eb',
          headerTitleStyle: { fontWeight: '600' },

          tabBarStyle: { backgroundColor: '#020617' },
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#64748b',

          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Type') {
              return (
                <MaterialCommunityIcons
                  name="mushroom"
                  size={size}
                  color={color}
                />
              );
            }

            let iconName;
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Environmental Monitoring') iconName = 'thermometer';
            else if (route.name === 'Pests') iconName = 'bug';
            else if (route.name === 'Disease') iconName = 'medkit';
            else if (route.name === 'Growth') iconName = 'stats-chart';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="Environmental Monitoring"
          component={EnvironmentStackNavigator}
          options={{ headerShown: false }}
        />
        <Tab.Screen name="Disease" component={DiseaseDetectionScreen} />
        <Tab.Screen name="Growth" component={GrowthPredictionScreen} />
        <Tab.Screen name="Type" component={MushroomTypeScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}