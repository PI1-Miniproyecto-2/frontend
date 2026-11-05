import { useParams } from 'react-router-dom'

function RoomForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)

  return (
    <section className="p-8">
      <h1 className="text-3xl font-bold text-[#073B43]">
        {isEditing ? 'Editar sala' : 'Crear sala'}
      </h1>
    </section>
  )
}

export default RoomForm