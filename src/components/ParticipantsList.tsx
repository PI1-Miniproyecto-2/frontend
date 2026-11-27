import { BookOpen, Lightbulb, Users } from 'lucide-react'
import type { SesionSala } from '../hooks/useRoomSocket'
import { nombreMiembro } from '../services/RoomDirectory'

const avatares = new Map([
  ['avatar_book', BookOpen],
  ['avatar_lamp', Lightbulb],
])

export default function ParticipantsList({ sesion, ownerUid, uid }: {
  sesion: SesionSala
  ownerUid: string
  uid: string
}) {
  const { conexion, presencia, directorio } = sesion
  const participantes = conexion.estado === 'connected' ? presencia : null
  const total = participantes?.length
  let resumen = 'Presencia no disponible.'
  if (total !== undefined) {
    resumen = total === 1 ? '1 participante conectado' : `${total} participantes conectados`
  } else if (conexion.estado === 'connecting' || conexion.estado === 'connected') {
    resumen = 'Cargando participantes…'
  }

  return (
    <section aria-labelledby="participantes-titulo" className="rounded-xl bg-[#10383E] p-4">
      <h2 id="participantes-titulo" className="flex items-center gap-2 text-lg font-bold">
        <Users size={19} className="text-[#70DCCB]" aria-hidden="true" />
        Participantes
      </h2>
      <p role="status" className="mt-1 text-sm text-teal-100">{resumen}</p>
      {participantes?.length === 1 && participantes[0] === uid && (
        <p className="mt-2 text-sm text-teal-100">Solo tú estás en la sala. Comparte el código para invitar a tus compañeros.</p>
      )}
      {directorio.error && (
        <div className="mt-2 text-sm text-amber-200">
          <p role="status">No pudimos consultar los perfiles de la sala.</p>
          {directorio.puedeReintentar && (
            <button type="button" onClick={() => sesion.acciones.current?.reintentarPerfiles()}
              className="min-h-11 rounded px-1 font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70DCCB]">
              Reintentar perfiles
            </button>
          )}
        </div>
      )}
      {Boolean(participantes?.length) && (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {participantes?.map(participante => {
            const avatarId = directorio.miembros.get(participante)?.avatarId ?? ''
            const Avatar = avatares.get(avatarId)
            const nombre = nombreMiembro(directorio, participante)
            const iniciales = directorio.miembros.has(participante) && nombre !== 'Usuario no disponible'
              ? nombre.split(/\s+/).slice(0, 2).map(palabra => Array.from(palabra)[0]).join('').toUpperCase()
              : '?'

            return (
              <li key={participante} className="flex items-center gap-3 rounded-lg bg-[#05272C] p-2">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#DDF7F2] font-bold text-[#073B43]">
                  {Avatar ? <Avatar size={19} /> : avatarId === 'avatar_owl' ? '🦉' : iniciales}
                </span>
                <div className="min-w-0 flex-1 wrap-anywhere">
                  <p className="font-semibold">{nombre}{participante === uid && ' (Tú)'}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-teal-100">
                    <span className="size-2 rounded-full bg-[#70DCCB]" aria-hidden="true" />
                    Conectado{participante === ownerUid && ' · Anfitrión'}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
