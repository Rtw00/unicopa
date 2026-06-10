export const formatarData = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
    })
}