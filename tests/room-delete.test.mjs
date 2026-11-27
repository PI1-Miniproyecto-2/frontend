import assert from 'node:assert/strict'
import test from 'node:test'
import { runnerImport } from 'vite'

const { module: { eliminarSala, confirmarEliminacionSala, comprobarDisponibilidadSala } } = await runnerImport(
  '/src/services/RoomsService.ts',
  {
    configFile: false,
    envDir: false,
    plugins: [{
      name: 'auth-de-prueba',
      enforce: 'pre',
      resolveId(id) { if (id === './AuthService') return '\0auth-de-prueba' },
      load(id) { if (id === '\0auth-de-prueba') return "export const obtenerToken = async () => 'token-de-prueba'" },
    }],
  },
)

const roomId = 'Abcdefghij0123456789'
const sala = {
  roomId, name: 'Álgebra', ownerUid: 'anfitrion', participantUids: ['estudiante'],
  status: 'active', createdAt: '2026-01-01T12:00:00.000Z',
}
const crearSignal = () => new AbortController().signal

test('valida ID y acepta 204 sin leer JSON ni enviar cuerpo', async t => {
  const peticion = t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    assert.ok(url.endsWith('/api/v1/rooms/' + roomId))
    assert.equal(opciones.method, 'DELETE')
    assert.deepEqual(opciones.headers, { Authorization: 'Bearer token-de-prueba' })
    assert.equal('body' in opciones, false)
    return new Response(null, { status: 204 })
  })

  await assert.rejects(eliminarSala('invalido'), { status: 400 })
  assert.equal(peticion.mock.callCount(), 0)
  assert.equal(await confirmarEliminacionSala(roomId, crearSignal()), 'eliminada')
  assert.equal(peticion.mock.callCount(), 1)
})

test('un timeout reconcilia por GET sin repetir DELETE', async t => {
  const metodos = []
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let iniciar
  const iniciado = new Promise(resolve => { iniciar = resolve })
  t.mock.method(globalThis, 'fetch', async (_url, { method }) => {
    metodos.push(method)
    if (method === 'DELETE') {
      iniciar()
      return new Promise(() => {})
    }
    return Response.json({}, { status: 404 })
  })
  const resultado = confirmarEliminacionSala(roomId, crearSignal())
  await iniciado
  t.mock.timers.tick(12_000)
  assert.equal(await resultado, 'no-disponible')
  assert.deepEqual(metodos, ['DELETE', 'GET'])
})

test('503 con una sala todavía visible y respuesta inesperada conservan el estado incierto', async t => {
  const metodos = []
  let status = 503
  t.mock.method(globalThis, 'fetch', async (_url, { method }) => {
    metodos.push(method)
    return method === 'DELETE' ? Response.json({}, { status }) : Response.json(sala)
  })
  assert.equal(await confirmarEliminacionSala(roomId, crearSignal()), 'incierta')
  status = 200
  assert.equal(await confirmarEliminacionSala(roomId, crearSignal()), 'incierta')
  assert.equal(await comprobarDisponibilidadSala(roomId, crearSignal()), 'disponible')
  assert.deepEqual(metodos, ['DELETE', 'GET', 'DELETE', 'GET', 'GET'])
})

test('404 es indisponibilidad y 401, 403 y 429 no repiten solicitudes', async t => {
  for (const status of [401, 403, 404, 429]) {
    const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status }))
    const resultado = confirmarEliminacionSala(roomId, crearSignal())
    if (status === 404) assert.equal(await resultado, 'no-disponible')
    else await assert.rejects(resultado, { status })
    assert.equal(fetch.mock.callCount(), 1)
    fetch.mock.restore()
  }
})

test('al abandonar la sesión invalida la respuesta pendiente sin consultar otro usuario', async t => {
  const control = new AbortController()
  let iniciar
  const iniciado = new Promise(resolve => { iniciar = resolve })
  const peticion = t.mock.method(globalThis, 'fetch', async () => {
    iniciar()
    return new Promise(() => {})
  })
  const resultado = confirmarEliminacionSala(roomId, control.signal)
  await iniciado
  control.abort()
  await assert.rejects(resultado, { name: 'AbortError' })
  assert.equal(peticion.mock.callCount(), 1)
})
