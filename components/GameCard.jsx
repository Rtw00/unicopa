import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { TEAM_FLAGS } from '../utils/flagMapping'

export default function GameCard({ game, favoritos, onToggleFavorito }) {
  const timeCasa = TEAM_FLAGS[game.sigla_casa]
  const timeFora = TEAM_FLAGS[game.sigla_fora]

  const isBrazil = game.sigla_casa === 'BRA' || game.sigla_fora === 'BRA'
  const isFavorito = favoritos?.includes(game.id)

  return (
    <View style={[styles.jogo, isBrazil && styles.jogoBrasil]}>

      <View style={styles.cabecalho}>
        <Text style={styles.grupo}>
          GRUPO {game.grupo}  {game.confronto}
        </Text>
        <TouchableOpacity onPress={() => onToggleFavorito(game.id)}>
          <Text style={[styles.estrela, isFavorito && styles.estrelaAtiva]}>
            {isFavorito ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.linhaPrincipal}>

        <View style={styles.time}>
          {timeCasa && <Image source={timeCasa} style={styles.bandeira} />}
          <Text style={styles.sigla}>{game.sigla_casa}</Text>
        </View>

        <View style={styles.horario}>
          <Text style={styles.hora}>{game.hora_brasilia}</Text>
          <Text style={styles.subTitulo}>VS</Text>
        </View>

        <View style={styles.time}>
          {timeFora && <Image source={timeFora} style={styles.bandeira} />}
          <Text style={styles.sigla}>{game.sigla_fora}</Text>
        </View>

      </View>

      <View style={styles.local}>
        <Text style={styles.subTitulo}>{game.estadio}</Text>
        <Text style={styles.subTitulo}>
          {game.cidade} • {game.pais}
        </Text>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  jogo: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2d3d',
    paddingBottom: 15
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  grupo: {
    color: '#8fa3b8',
    fontSize: 12,
    flex: 1,
  },
  estrela: {
    fontSize: 22,
    color: '#8fa3b8',
  },
  estrelaAtiva: {
    color: '#f2cc2f',
  },
  linhaPrincipal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  bandeira: {
    width: 28,
    height: 28,
    borderRadius: 14
  },
  sigla: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  horario: {
    alignItems: 'center'
  },
  hora: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  local: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  subTitulo: {
    color: '#8fa3b8',
    fontSize: 12
  },
  jogoBrasil: {
    backgroundColor: '#16351f'
  },
})
