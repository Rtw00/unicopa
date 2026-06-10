import { useState } from 'react'
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, ImageBackground, Image, Alert
} from 'react-native'
import { supabase } from '../utils/supabase'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function fazerLogin() {
  if (!email || !senha) {
    Alert.alert('Atenção', 'Preencha e-mail e senha.')
    return
  }

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailValido) {
    Alert.alert('Atenção', 'Digite um e-mail válido.')
    return
  }

  setCarregando(true)
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
  setCarregando(false)

  if (error) {
    Alert.alert('Erro', 'E-mail ou senha incorretos.')
  }
}

  return (
    <ImageBackground style={styles.container} source={require('../assets/bg-overlay.png')}>
      <Image style={styles.logo} source={require('../assets/unicopa.png')} />

      <View style={styles.card}>
        <Text style={styles.titulo}>Entrar</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#8fa3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#8fa3b8"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity
          style={[styles.botao, carregando && styles.botaoDesabilitado]}
          onPress={fazerLogin}
          disabled={carregando}
        >
          <Text style={styles.botaoTexto}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.linkTexto}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040b13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#0c1b2a',
    width: 320,
    borderRadius: 12,
    padding: 24,
    gap: 14,
  },
  titulo: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0f2236',
    borderWidth: 1,
    borderColor: '#1e2d3d',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 15,
  },
  botao: {
    backgroundColor: '#f2cc2f',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  botaoTexto: {
    color: '#040b13',
    fontWeight: 'bold',
    fontSize: 15,
  },
  linkTexto: {
    color: '#8fa3b8',
    textAlign: 'center',
    fontSize: 13,
  },
})