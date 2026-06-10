import { useState, useEffect } from 'react'
import {
  StyleSheet, Text, View, ImageBackground, Image,
  SectionList, TouchableOpacity, TextInput, Alert, Modal
} from 'react-native'
import { supabase } from '../utils/supabase'
import { formatarData } from '../utils/DateFormat'
import { TEAM_FLAGS } from '../utils/flagMapping'

export default function PalpitesScreen() {
  const [jogos, setJogos] = useState([])
  const [palpites, setPalpites] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [usuarioId, setUsuarioId] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [jogoRevisao, setJogoRevisao] = useState(null)

  useEffect(() => {
    carregarUsuario()
  }, [])

  useEffect(() => {
    if (usuarioId) {
      carregarJogos()
      carregarPalpites()
    }
  }, [usuarioId])

  async function carregarUsuario() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) setUsuarioId(session.user.id)
  }

  async function carregarJogos() {
    const { data, error } = await supabase
      .from('jogos')
      .select('*')
      .order('data_brasilia', { ascending: true })
    if (!error) setJogos(data)
  }

  async function carregarPalpites() {
    const { data, error } = await supabase
      .from('palpites')
      .select('*')
      .eq('id_usuario', usuarioId)

    if (!error) {
      const mapa = {}
      data.forEach(p => {
        mapa[p.id_jogo] = {
          casa: String(p.placar_time_casa ?? ''),
          fora: String(p.placar_time_fora ?? ''),
          situacao: p.situacao,
          id: p.id,
        }
      })
      setPalpites(mapa)
    }
  }

  function jogoJaComecou(jogo) {
    const agora = new Date()
    const inicio = new Date(`${jogo.data_brasilia}T${jogo.hora_brasilia}`)
    return agora >= inicio
  }

  function atualizarPlacar(jogoId, campo, valor) {
    const numerico = valor.replace(/[^0-9]/g, '')
    setPalpites(prev => ({
      ...prev,
      [jogoId]: {
        casa: prev[jogoId]?.casa ?? '',
        fora: prev[jogoId]?.fora ?? '',
        ...prev[jogoId],
        [campo]: numerico
      }
    }))
  }

  async function salvarPalpite(jogo) {
    const p = palpites[jogo.id]
    if (!p || p.casa === '' || p.fora === '') {
      Alert.alert('Atenção', 'Preencha os dois placares.')
      return
    }
    if (jogoJaComecou(jogo)) {
      Alert.alert('Atenção', 'Este jogo já começou.')
      return
    }

    setSalvando(true)
    const payload = {
      id_usuario: usuarioId,
      id_jogo: jogo.id,
      placar_time_casa: parseInt(p.casa),
      placar_time_fora: parseInt(p.fora),
      situacao: 'pendente',
    }

    const { error } = p.id
      ? await supabase.from('palpites').update(payload).eq('id', p.id)
      : await supabase.from('palpites').insert(payload)

    setSalvando(false)

    if (error) {
      Alert.alert('Erro', error.message)
    } else {
      carregarPalpites()
    }
  }

  async function confirmarPalpite() {
    const jogo = jogoRevisao
    const p = palpites[jogo.id]

    const { error } = await supabase
      .from('palpites')
      .update({ situacao: 'confirmado' })
      .eq('id', p.id)

    setJogoRevisao(null)

    if (error) {
      Alert.alert('Erro', error.message)
    } else {
      Alert.alert('Sucesso!', 'Palpite confirmado!')
      carregarPalpites()
    }
  }

  function abrirRevisao(jogo) {
    const p = palpites[jogo.id]
    if (!p?.id) {
      Alert.alert('Atenção', 'Salve o palpite antes de confirmar.')
      return
    }
    if (jogoJaComecou(jogo)) {
      Alert.alert('Atenção', 'Este jogo já começou.')
      return
    }
    setJogoRevisao(jogo)
  }

  const jogosFiltrados = jogos.filter(j => {
    const p = palpites[j.id]
    if (filtro === 'pendentes') return p?.situacao === 'pendente'
    if (filtro === 'confirmados') return p?.situacao === 'confirmado'
    return true
  })

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

  function renderJogo({ item: jogo }) {
    const p = palpites[jogo.id]
    const bloqueado = jogoJaComecou(jogo)
    const confirmado = p?.situacao === 'confirmado'
    const flagCasa = TEAM_FLAGS[jogo.sigla_casa]
    const flagFora = TEAM_FLAGS[jogo.sigla_fora]

    return (
      <View style={[styles.jogoCard, bloqueado && styles.jogoBloqueado]}>
        <Text style={styles.jogoGrupo}>
          {jogo.grupo ? `GRUPO ${jogo.grupo}` : jogo.fase} • {jogo.hora_brasilia}
          {bloqueado && <Text style={styles.bloqueadoTag}> • INICIADO</Text>}
          {confirmado && <Text style={styles.confirmadoTag}> • ✓ CONFIRMADO</Text>}
        </Text>

        <View style={styles.jogoLinha}>

          <View style={styles.timeCasa}>
            {flagCasa && <Image source={flagCasa} style={styles.bandeira} />}
            <Text style={styles.sigla}>{jogo.sigla_casa}</Text>
          </View>

          <View style={styles.placarContainer}>
            <TextInput
              style={[styles.placarInput, (bloqueado || confirmado) && styles.inputBloqueado]}
              keyboardType="numeric"
              maxLength={2}
              value={p?.casa ?? ''}
              onChangeText={v => atualizarPlacar(jogo.id, 'casa', v)}
              editable={!bloqueado && !confirmado}
              placeholder="-"
              placeholderTextColor="#8fa3b8"
            />
            <Text style={styles.placarSep}>x</Text>
            <TextInput
              style={[styles.placarInput, (bloqueado || confirmado) && styles.inputBloqueado]}
              keyboardType="numeric"
              maxLength={2}
              value={p?.fora ?? ''}
              onChangeText={v => atualizarPlacar(jogo.id, 'fora', v)}
              editable={!bloqueado && !confirmado}
              placeholder="-"
              placeholderTextColor="#8fa3b8"
            />
          </View>

          <View style={styles.timeFora}>
            <Text style={styles.sigla}>{jogo.sigla_fora}</Text>
            {flagFora && <Image source={flagFora} style={styles.bandeira} />}
          </View>

        </View>

        {!bloqueado && !confirmado && (
          <View style={styles.botoesContainer}>
            <TouchableOpacity
              style={styles.botaoSalvar}
              onPress={() => salvarPalpite(jogo)}
              disabled={salvando}
            >
              <Text style={styles.botaoTexto}>Salvar</Text>
            </TouchableOpacity>

            {p?.id && (
              <TouchableOpacity
                style={styles.botaoConfirmar}
                onPress={() => abrirRevisao(jogo)}
              >
                <Text style={styles.botaoTexto}>Confirmar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    )
  }

  return (
    <ImageBackground style={styles.container} source={require('../assets/bg-overlay.png')}>
      <Image style={styles.logo} source={require('../assets/unicopa.png')} />

      <Text style={styles.titulo}>MEUS PALPITES</Text>

      <View style={styles.filtroContainer}>
        {['todos', 'pendentes', 'confirmados'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroBotao, filtro === f && styles.filtroBotaoAtivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroTexto, filtro === f && styles.filtroTextoAtivo]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {jogosTratados.length === 0 ? (
        <View style={styles.vazioContainer}>
          <Text style={styles.vazioIcone}>🎯</Text>
          <Text style={styles.vazioTitulo}>Você ainda não cadastrou palpites</Text>
        </View>
      ) : (
        <SectionList
          sections={jogosTratados}
          keyExtractor={item => item.id.toString()}
          renderItem={renderJogo}
          renderSectionHeader={({ section }) => (
            <Text style={styles.dataHeader}>{section.title}</Text>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {/* Modal de revisão — RF-016 */}
      <Modal
        visible={!!jogoRevisao}
        transparent
        animationType="fade"
        onRequestClose={() => setJogoRevisao(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Revisar palpite</Text>

            {jogoRevisao && (
              <>
                <Text style={styles.modalJogo}>
                  {jogoRevisao.sigla_casa} x {jogoRevisao.sigla_fora}
                </Text>
                <Text style={styles.modalData}>
                  {formatarData(jogoRevisao.data_brasilia)} • {jogoRevisao.hora_brasilia}
                </Text>
                <View style={styles.modalPlacar}>
                  <Text style={styles.modalPlacarNumero}>
                    {palpites[jogoRevisao.id]?.casa}
                  </Text>
                  <Text style={styles.modalPlacarSep}>x</Text>
                  <Text style={styles.modalPlacarNumero}>
                    {palpites[jogoRevisao.id]?.fora}
                  </Text>
                </View>
                <Text style={styles.modalAviso}>
                  Após confirmar não será possível editar este palpite.
                </Text>
              </>
            )}

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.modalBotaoCancelar}
                onPress={() => setJogoRevisao(null)}
              >
                <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBotaoConfirmar}
                onPress={confirmarPalpite}
              >
                <Text style={styles.modalBotaoConfirmarTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040b13',
    alignItems: 'center',
  },
  logo: {
    marginTop: 20,
    width: 200,
    height: 50,
    resizeMode: 'contain',
  },
  titulo: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  filtroContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
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
  dataHeader: {
    color: '#f2cc2f',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  jogoCard: {
    backgroundColor: '#0c1b2a',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
  },
  jogoBloqueado: {
    opacity: 0.6,
  },
  jogoGrupo: {
    color: '#8fa3b8',
    fontSize: 11,
    marginBottom: 10,
  },
  bloqueadoTag: {
    color: '#e05555',
  },
  confirmadoTag: {
    color: '#4caf50',
  },
  jogoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeCasa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-start',
  },
  timeFora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  bandeira: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  sigla: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  placarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placarInput: {
    backgroundColor: '#0f2236',
    borderWidth: 1,
    borderColor: '#1e2d3d',
    borderRadius: 8,
    width: 44,
    height: 44,
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputBloqueado: {
    opacity: 0.5,
  },
  placarSep: {
    color: '#8fa3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botoesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  botaoSalvar: {
    backgroundColor: '#1e2d3d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botaoConfirmar: {
    backgroundColor: '#f2cc2f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botaoTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  vazioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  vazioIcone: {
    fontSize: 48,
  },
  vazioTitulo: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#0c1b2a',
    borderRadius: 16,
    padding: 24,
    width: 300,
    alignItems: 'center',
    gap: 12,
  },
  modalTitulo: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalJogo: {
    color: '#f2cc2f',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalData: {
    color: '#8fa3b8',
    fontSize: 13,
  },
  modalPlacar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  modalPlacarNumero: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  modalPlacarSep: {
    color: '#8fa3b8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalAviso: {
    color: '#8fa3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBotaoCancelar: {
    borderWidth: 1,
    borderColor: '#1e2d3d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBotaoCancelarTexto: {
    color: '#8fa3b8',
    fontWeight: 'bold',
  },
  modalBotaoConfirmar: {
    backgroundColor: '#f2cc2f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBotaoConfirmarTexto: {
    color: '#040b13',
    fontWeight: 'bold',
  },
})