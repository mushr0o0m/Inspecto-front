import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="page">
      <h1 className="text-heading-3">Страница не найдена</h1>
      <Link to="/" className="text-link">
        Вернуться на главную
      </Link>
    </section>
  )
}
