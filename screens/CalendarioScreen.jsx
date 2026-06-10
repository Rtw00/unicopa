import { StyleSheet, Text, View, Image, ImageBackground, SectionList, TouchableOpacity, ScrollView, Alert } from 'react-native'

import { formatarData } from '../utils/DateFormat'
import DiaCard from '../components/DiaCard'
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const dadosJSON = require('../assets/dados.json')

export default function CalendarioScreen() {

  const [jogos, setJogos] = useState([])
  const [favoritos, setFavoritos] = useState([])
  const [grupoSelecionado, setGrupoSelecionado] = useState(null)
  const [importando, setImportando] = useState(false)
  const [usuarioId, setUsuarioId] = useState(null)

  useEffect(() => {
    carregarUsuario()
    carregarJogos()
  }, [])

  useEffect(() => {
    if (usuarioId) carregarFavoritos()
  }, [usuarioId])

  async function carregarUsuario() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) setUsuarioId(session.user.id)
  }

  async function fazerLogout() {
    await supabase.auth.signOut()
  }

  async function carregarJogos() {
    const { data, error } = await supabase
      .from('jogos')
      .select('*')
      .order('data_brasilia', { ascending: true })

    if (!error) setJogos(data)
  }

  async function carregarFavoritos() {
    const { data, error } = await supabase
      .from('favoritos')
      .select('jogo_id')
      .eq('usuario_id', usuarioId)

    if (!error) {
      setFavoritos(data.map(f => f.jogo_id))
    }
  }

  async function toggleFavorito(id) {
    const isFavorito = favoritos.includes(id)

    setFavoritos(prev =>
      isFavorito ? prev.filter(f => f !== id) : [...prev, id]
    )

    if (isFavorito) {
      await supabase
        .from('favoritos')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('jogo_id', id)
    } else {
      await supabase
        .from('favoritos')
        .insert({ usuario_id: usuarioId, jogo_id: id })
    }
  }

  async function importarJogos() {
    setImportando(true)
    try {
      const jogosParaInserir = dadosJSON.jogos.map(j => ({
        id: j.id,
        fase: j.fase,
        grupo: j.grupo,
        partida: j.confronto,
        hora_et: j.hora_et,
        data_brasilia: j.data_brasilia,
        hora_brasilia: j.hora_brasilia,
        time_casa: j.time_casa,
        time_fora: j.time_fora,
        sigla_casa: j.sigla_casa,
        sigla_fora: j.sigla_fora,
        confronto: j.confronto,
        estadio: j.estadio,
        cidade: j.cidade,
        pais: j.pais,
      }))

      const { error } = await supabase
        .from('jogos')
        .upsert(jogosParaInserir, { onConflict: 'id' })

      if (error) throw error

      Alert.alert('Sucesso!', `${jogosParaInserir.length} jogos importados!`)
      carregarJogos()
    } catch (e) {
      Alert.alert('Erro', e.message)
    } finally {
      setImportando(false)
    }
  }

  const jogosOrdenados = [...jogos].sort((a, b) =>
    new Date(`${a.data_brasilia}T${a.hora_brasilia}`) - new Date(`${b.data_brasilia}T${b.hora_brasilia}`)
  )

  const jogosFiltrados = grupoSelecionado
    ? jogosOrdenados.filter(j => j.grupo === grupoSelecionado)
    : jogosOrdenados

  const grupos = [...new Set(jogos.map(j => j.grupo).filter(Boolean))].sort()

  const agruparPorData = (lista) =>
    lista.reduce((acc, jogo) => {
      const data = formatarData(jogo.data_brasilia)
      if (!acc[data]) acc[data] = []
      acc[data].push(jogo)
      return acc
    }, {})

  const jogosAgrupados = agruparPorData(jogosFiltrados)

  const jogosTratados = Object.keys(jogosAgrupados).map(data => ({
    title: data,
    data: jogosAgrupados[data]
  }))

  return (
    <ImageBackground style={styles.container} source={require('../assets/bg-overlay.png')}>
      <Image style={styles.logo} source={require('../assets/unicopa.png')} />

      <View style={styles.cabecalho}>
        <Text style={styles.title}>CALENDÁRIO</Text>
        <TouchableOpacity onPress={fazerLogout}>
          <Text style={styles.logoutTexto}>Sair</Text>
        </TouchableOpacity>
      </View>

      {grupos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtroScroll}
          contentContainerStyle={styles.filtroContainer}
        >
          <TouchableOpacity
            style={[styles.filtroBotao, !grupoSelecionado && styles.filtroBotaoAtivo]}
            onPress={() => setGrupoSelecionado(null)}
          >
            <Text style={[styles.filtroTexto, !grupoSelecionado && styles.filtroTextoAtivo]}>
              Todos
            </Text>
          </TouchableOpacity>

          {grupos.map(grupo => (
            <TouchableOpacity
              key={grupo}
              style={[styles.filtroBotao, grupoSelecionado === grupo && styles.filtroBotaoAtivo]}
              onPress={() => setGrupoSelecionado(grupo)}
            >
              <Text style={[styles.filtroTexto, grupoSelecionado === grupo && styles.filtroTextoAtivo]}>
                Grupo {grupo}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {jogos.length === 0 ? (
        <View style={styles.vazioContainer}>
          <Text style={styles.vazioIcone}>📭</Text>
          <Text style={styles.vazioTitulo}>Nenhum jogo carregado</Text>
          <Text style={styles.vazioSubtitulo}>Importe os jogos para começar</Text>
          <TouchableOpacity
            style={[styles.importarBotao, importando && styles.importarBotaoDesabilitado]}
            onPress={importarJogos}
            disabled={importando}
          >
            <Text style={styles.importarTexto}>
              {importando ? 'Importando...' : '⬇ Importar jogos'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={jogosTratados}
          keyExtractor={(item) => item.id.toString()}
          renderItem={() => null}
          renderSectionHeader={({ section }) => (
            <DiaCard
              data={section.title}
              jogos={section.data}
              favoritos={favoritos}
              onToggleFavorito={toggleFavorito}
            />
          )}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <Text style={styles.vazioIcone}>🔍</Text>
              <Text style={styles.vazioTitulo}>Nenhum jogo neste grupo</Text>
            </View>
          }
        />
      )}
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#040b13',
    alignItems: 'center',
  },
  logo: {
    marginTop: 20,
    width: 200,
    height: 50,
    resizeMode: 'contain'
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 320,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  logoutTexto: {
    color: '#8fa3b8',
    fontSize: 13,
  },
  filtroScroll: {
    marginTop: 12,
    maxHeight: 40,
  },
  filtroContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filtroBotao: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e2d3d',
    backgroundColor: '#0c1b2a',
  },
  filtroBotaoAtivo: {
    backgroundColor: '#f2cc2f',
    borderColor: '#f2cc2f',
  },
  filtroTexto: {
    color: '#8fa3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filtroTextoAtivo: {
    color: '#040b13',
  },
  vazioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 10,
  },
  vazioIcone: {
    fontSize: 48,
  },
  vazioTitulo: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  vazioSubtitulo: {
    color: '#8fa3b8',
    fontSize: 14,
  },
  importarBotao: {
    marginTop: 16,
    backgroundColor: '#f2cc2f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  importarBotaoDesabilitado: {
    opacity: 0.5,
  },
  importarTexto: {
    color: '#040b13',
    fontWeight: 'bold',
    fontSize: 15,
  },
})