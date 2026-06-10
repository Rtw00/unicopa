import { useState } from 'react'
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, ImageBackground, Image, Alert
} from 'react-native'
import { supabase } from '../utils/supabase'

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function fazerCadastro() {
    if (!email || !senha || !confirmar) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.')
      return
    }
    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmar) {
      Alert.alert('Atenção', 'As senhas não coincidem.')
      return
    }

    setCarregando(true)
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }
    })
    setCarregando(false)

    if (error) {
      Alert.alert('Erro', error.message)
    } else {
      Alert.alert(
        'Cadastro realizado!',
        'Verifique seu e-mail para confirmar o cadastro.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      )
    }
  }

  return (
    <ImageBackground style={styles.container} source={require('../assets/bg-overlay.png')}>
      <Image style={styles.logo} source={require('../assets/unicopa.png')} />

      <View style={styles.card}>
        <Text style={styles.titulo}>Cadastrar-se</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome (opcional)"
          placeholderTextColor="#8fa3b8"
          value={nome}
          onChangeText={setNome}
        />

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
          placeholder="Senha (mín. 6 caracteres)"
          placeholderTextColor="#8fa3b8"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          placeholderTextColor="#8fa3b8"
          secureTextEntry
          value={confirmar}
          onChangeText={setConfirmar}
        />

        <TouchableOpacity
          style={[styles.botao, carregando && styles.botaoDesabilitado]}
          onPress={fazerCadastro}
          disabled={carregando}
        >
          <Text style={styles.botaoTexto}>
            {carregando ? 'Cadastrando...' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkTexto}>Já tem conta? Entrar</Text>
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