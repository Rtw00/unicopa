import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { supabase } from './utils/supabase'

import LoginScreen from './screens/LoginScreen'
import CadastroScreen from './screens/CadastroScreen'
import CalendarioScreen from './screens/CalendarioScreen'
import PalpitesScreen from './screens/PalpitesScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabsPrincipais() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0c1b2a', borderTopColor: '#1e2d3d' },
        tabBarActiveTintColor: '#f2cc2f',
        tabBarInactiveTintColor: '#8fa3b8',
      }}
    >
      <Tab.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{ tabBarLabel: 'Calendário', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📅</Text> }}
      />
      <Tab.Screen
        name="Palpites"
        component={PalpitesScreen}
        options={{ tabBarLabel: 'Palpites', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎯</Text> }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const [sessao, setSessao] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session)
      setCarregando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (carregando) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {sessao ? (
          <Stack.Screen name="Principal" component={TabsPrincipais} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}