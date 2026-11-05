import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <p className="text-6xl font-bold text-[#18B6A4]">404</p>
      <h1 className="mt-4 text-3xl font-bold text-[#073B43]">Página no encontrada</h1>
      <p className="mt-3 text-[#647779]">Lo sentimos, la página que buscas no existe.</p>
      <Link to="/" className="mt-6 rounded-lg bg-[#073B43] px-6 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18B6A4]">
        Volver al inicio
      </Link>
    </section>
  )
}
export default NotFound