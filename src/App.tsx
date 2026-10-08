import './styles/sanitize.css'
import './styles/variables.css'
import './styles/base.css'
import './styles/text.css'
import './styles/app.css'
import { RouterProvider } from 'react-router-dom'
import router from './navigation'

export default function App() {
  return <RouterProvider router={router} />
}
