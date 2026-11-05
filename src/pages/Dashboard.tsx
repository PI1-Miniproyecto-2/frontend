
import { useState } from 'react'
import {
  Plus,
  Link as LinkIcon,
  ArrowRight,
  MoreHorizontal,
  BookOpen,
} from 'lucide-react'

function Dashboard() {
  const [roomCode, setRoomCode] = useState('')

  const handleJoinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!roomCode.trim()) return

    console.log('Uniéndose a sala:', roomCode)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-full border border-emerald-200">
          Prototipo interactivo · sin conexión real
        </span>

        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-sm"
            aria-label="Usuario Emilio"
            role="img"
          >
            CE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-[#0A3C3E] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          <div>
            <p className="text-xs font-semibold tracking-wider text-emerald-300 uppercase mb-2">
              MARTES, 18 DE JUNIO
            </p>

            <h2 className="text-3xl font-bold mb-1">
              ¡Hola, Emilio!
            </h2>

            <p className="text-emerald-100 text-sm">
              ¿Qué vamos a estudiar hoy?
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              className="flex items-center gap-2 bg-[#047857] hover:bg-[#065F46] text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A3C3E]"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Crear sala
            </button>

            <button
              type="button"
              className="flex items-center gap-2 bg-white text-[#0A3C3E] hover:bg-gray-100 font-medium px-5 py-2.5 rounded-xl transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A3C3E]"
            >
              <LinkIcon className="w-4 h-4" aria-hidden="true" />
              Ingresar un código
            </button>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Únete a una sala
            </h3>

            <p className="text-xs text-gray-600 mb-4">
              Pega el código que te compartió tu compañero.
            </p>

            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <label
                  htmlFor="room-code"
                  className="block text-xs font-medium text-gray-800 mb-1"
                >
                  Código de acceso
                </label>

                <input
                  id="room-code"
                  name="roomCode"
                  type="text"
                  placeholder="EJ. AULA-204"
                  autoComplete="off"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] focus-visible:border-[#047857] text-sm uppercase placeholder:normal-case placeholder:text-gray-600"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#86EFAC] hover:bg-[#6EE7B7] text-[#0A3C3E] font-semibold py-2.5 rounded-xl transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] focus-visible:ring-offset-2"
              >
                Unirse a una sala
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              TUS ESPACIOS
            </p>

            <h3 className="text-xl font-bold text-gray-900">
              Mis salas recientes
            </h3>
          </div>

          <button
            type="button"
            className="text-sm font-semibold text-[#047857] hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] focus-visible:ring-offset-2 rounded"
          >
            Ver todas
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-[#047857]">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              </div>

              <button
                type="button"
                aria-label="Más opciones de Fotografía documental"
                className="text-gray-600 hover:text-gray-900 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
              >
                <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <h4 className="font-bold text-gray-900 mb-1">
              Fotografía documental
            </h4>

            <p className="text-xs text-gray-600 line-clamp-2">
              Curaduría y revisión del proyecto final...
            </p>
          </article>

          <article className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-[#047857]">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              </div>

              <button
                type="button"
                aria-label="Más opciones de Ingeniería ambiental"
                className="text-gray-600 hover:text-gray-900 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
              >
                <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <h4 className="font-bold text-gray-900 mb-1">
              Ingeniería ambiental
            </h4>

            <p className="text-xs text-gray-600 line-clamp-2">
              Análisis de impacto hídrico – Grupo 04.
            </p>
          </article>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
