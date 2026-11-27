import assert from 'node:assert/strict'
import test from 'node:test'
import { runnerImport } from 'vite'

const { module: { editarSala, guardarNombreSala, validarNombreSala } } = await runnerImport(
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

test('valida nombre recortado de 1 a 100 unidades UTF-16', () => {
  assert.ok(validarNombreSala('  '))
  assert.equal(validarNombreSala('  Á  '), '')
  assert.equal(validarNombreSala('😀'.repeat(50)), '')
  assert.ok(validarNombreSala('😀'.repeat(50) + 'a'))
})

test('envía solo name en PATCH autenticado y descarta una respuesta de otra sala', async t => {
  const peticion = t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    assert.match(url, new RegExp('/api/v1/rooms/' + roomId + '$'))
    assert.equal(opciones.method, 'PATCH')
    assert.equal(opciones.headers.Authorization, 'Bearer token-de-prueba')
    assert.equal(opciones.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(opciones.body), { name: 'Álgebra' })
    return Response.json(peticion.mock.callCount() === 0 ? sala : { ...sala, roomId: 'Zbcdefghij0123456789' })
  })

  await assert.rejects(editarSala('invalido', 'Álgebra'), { status: 400 })
  await assert.rejects(editarSala(roomId, '   '), { status: 400 })
  assert.equal(peticion.mock.callCount(), 0)
  assert.deepEqual(await editarSala(roomId, '  Álgebra  '), sala)
  await assert.rejects(editarSala(roomId, 'Álgebra'), { tipo: 'respuesta' })
})

test('una escritura incierta se reconcilia con GET sin repetir PATCH', async t => {
  const metodos = []
  t.mock.method(globalThis, 'fetch', async (_url, { method }) => {
    metodos.push(method)
    if (method === 'PATCH') throw new TypeError('Respuesta perdida')
    return Response.json(sala)
  })

  assert.deepEqual(await guardarNombreSala(roomId, 'Álgebra', new AbortController().signal), { sala, confirmado: true })
  assert.deepEqual(await guardarNombreSala(roomId, 'Cálculo', new AbortController().signal), { sala, confirmado: false })
  assert.deepEqual(metodos, ['PATCH', 'GET', 'PATCH', 'GET'])
})

test('401, 403, 404 y 429 se conservan sin repetir el intento', async t => {
  for (const status of [401, 403, 404, 429]) {
    const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status }))
    await assert.rejects(guardarNombreSala(roomId, 'Álgebra', new AbortController().signal), { status })
    assert.equal(fetch.mock.callCount(), 1)
    fetch.mock.restore()
  }
})
