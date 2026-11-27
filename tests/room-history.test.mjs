import assert from 'node:assert/strict'
import { setImmediate } from 'node:timers/promises'
import test from 'node:test'
import { runnerImport } from 'vite'

const { module: { crearHistorialSala, incorporarMensajes, ordenarMensajes, validarPagina } } =
  await runnerImport('/src/services/RoomHistory.ts', { configFile: false, envDir: false })

const roomId = 'Abcdefghij0123456789'

function mensaje(n, overrides = {}) {
  return {
    roomId,
    id: String(n).padStart(3, '0'),
    authorUid: 'estudiante',
    createdAt: new Date(n * 1000).toISOString(),
    content: 'Texto compartido',
    ...overrides,
  }
}

function respuesta(messages, hasMore = false) {
  return { ok: true, data: { roomId, messages, hasMore, nextCursor: hasMore ? messages[0].id : null } }
}

function crearPrueba(total = 0) {
  const guardados = Array.from({ length: total }, (_, i) => mensaje(i + 1))
  const solicitudes = []
  const recibidos = new Map()
  const errores = []
  let estado
  let proxima
  const historial = crearHistorialSala(roomId, {
    consultar: async before => {
      solicitudes.push(before)
      if (proxima) {
        const consulta = proxima
        proxima = undefined
        return consulta()
      }
      const fin = before === undefined ? guardados.length : guardados.findIndex(item => item.id === before)
      return respuesta(guardados.slice(Math.max(0, fin - 20), fin), fin > 20)
    },
    publicar: siguiente => { estado = siguiente },
    incorporar: mensajes => incorporarMensajes(recibidos, mensajes).length,
    resolverError: codigo => errores.push(codigo),
    vigente: () => true,
  })

  return {
    historial, guardados, recibidos, solicitudes, errores,
    estado: () => estado,
    interceptar: consulta => { proxima = consulta },
  }
}

test('combina por ID y ordena por fecha e ID sin perder textos iguales', () => {
  const destino = new Map()
  const fecha = mensaje(1).createdAt
  const primero = mensaje(1, { id: 'Z', createdAt: fecha })
  const segundo = mensaje(1, { id: 'a', createdAt: fecha })
  assert.equal(incorporarMensajes(destino, [segundo, primero]).length, 2)
  assert.equal(incorporarMensajes(destino, [primero]).length, 0)
  assert.deepEqual(ordenarMensajes(destino.values()), [primero, segundo])
})

test('valida sala, tamaño, cursor, duplicados y ausencia de páginas adicionales', () => {
  const pagina = respuesta(Array.from({ length: 20 }, (_, i) => mensaje(i + 1)), true).data
  assert.ok(validarPagina(pagina, roomId))
  assert.equal(validarPagina(pagina, roomId, pagina.nextCursor), null)
  assert.equal(validarPagina({ ...pagina, nextCursor: 'inventado' }, roomId), null)
  assert.equal(validarPagina({ ...pagina, nextCursor: null }, roomId), null)
  assert.equal(validarPagina({ ...pagina, messages: [mensaje(1), mensaje(1)] }, roomId), null)
  assert.equal(validarPagina(respuesta([mensaje(1, { roomId: 'otra' })]).data, roomId), null)
  assert.ok(validarPagina(respuesta([]).data, roomId))
})

test('serializa solicitudes de páginas y conserva el cursor tras timeout o respuesta inválida', async () => {
  const prueba = crearPrueba(43)
  prueba.historial.ingresar()
  await setImmediate()
  prueba.interceptar(() => { throw new Error('ACK timeout') })
  prueba.historial.cargarAnteriores()
  prueba.historial.cargarAnteriores()
  await setImmediate()
  assert.equal(prueba.estado().fase, 'errorAnteriores')
  assert.equal(prueba.recibidos.size, 20)

  prueba.interceptar(() => respuesta(prueba.guardados.slice(23), true))
  prueba.historial.cargarAnteriores()
  await setImmediate()
  assert.equal(prueba.estado().fase, 'errorAnteriores')
  prueba.historial.cargarAnteriores()
  await setImmediate()
  assert.equal(prueba.recibidos.size, 40)
  prueba.historial.cargarAnteriores()
  await setImmediate()
  prueba.historial.cargarAnteriores()
  assert.deepEqual(prueba.solicitudes, [undefined, '024', '024', '024', '004'])
  assert.equal(prueba.recibidos.size, 43)
  assert.equal(prueba.estado().hayAnteriores, false)
})

test('limita la recuperación, conserva el cursor antiguo y no usa un mensaje nuevo como continuidad', async () => {
  const prueba = crearPrueba(45)
  prueba.historial.ingresar()
  await setImmediate()
  prueba.historial.interrumpir()
  for (let n = 46; n <= 134; n++) prueba.guardados.push(mensaje(n))
  incorporarMensajes(prueba.recibidos, [mensaje(134)])
  prueba.historial.ingresar()
  await setImmediate()
  assert.equal(prueba.estado().fase, 'incompleto')
  assert.equal(prueba.solicitudes.length, 5)
  prueba.historial.reintentar()
  await setImmediate()
  assert.equal(prueba.estado().fase, 'listo')
  assert.equal(prueba.recibidos.size, 109)
  prueba.historial.cargarAnteriores()
  await setImmediate()
  assert.equal(prueba.solicitudes.at(-1), '026')
})

test('descarta un ACK tardío al desconectar otra vez o cerrar la sesión', async () => {
  const prueba = crearPrueba(40)
  prueba.historial.ingresar()
  await setImmediate()
  prueba.historial.interrumpir()
  let confirmar
  prueba.interceptar(() => new Promise(resolve => { confirmar = resolve }))
  prueba.historial.ingresar()
  prueba.historial.interrumpir()
  confirmar(respuesta([mensaje(100)]))
  await setImmediate()
  assert.equal(prueba.estado().fase, 'interrumpido')
  assert.equal(prueba.recibidos.has('100'), false)
  prueba.historial.ingresar()
  await setImmediate()
  assert.equal(prueba.estado().fase, 'listo')

  prueba.interceptar(() => new Promise(resolve => { confirmar = resolve }))
  prueba.historial.cargarAnteriores()
  prueba.historial.cerrar()
  confirmar(respuesta([mensaje(101)]))
  await setImmediate()
  assert.equal(prueba.recibidos.has('101'), false)
})

test('expone un error inicial y deriva denegaciones al control de sesión', async () => {
  const prueba = crearPrueba()
  prueba.interceptar(() => ({ ok: false, error: { code: 'HISTORY_ERROR' } }))
  prueba.historial.ingresar()
  await setImmediate()
  assert.equal(prueba.estado().fase, 'errorInicial')
  prueba.interceptar(() => ({ ok: false, error: { code: 'FORBIDDEN' } }))
  prueba.historial.reintentar()
  await setImmediate()
  assert.deepEqual(prueba.errores, ['HISTORY_ERROR', 'FORBIDDEN'])
  prueba.historial.reintentar()
  await setImmediate()
  assert.equal(prueba.estado().fase, 'listo')
})
