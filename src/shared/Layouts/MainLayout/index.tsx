import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import Button from '@/shared/Buttons/Button'
import ArrowLeft from '@/assets/icons/arrowLeft.svg?react'
import HomeIcon from '@/assets/icons/home.svg?react'
import LiveClock from './components/LiveClock'
import css from './mainLayout.module.css'

export default function MainLayout() {
  const [navigationOpen, setNavigationOpen] = useState(() => window.matchMedia('(min-width: 900px)').matches)

  return (
    <div className={css.wrapper}>
      <a className="skip-link" href="#main-content">
        Перейти к содержимому
      </a>
      <header className={css.header}>
        <div className={css.headerShadow} />
        <Link to="/" className={css.brand}>
          Inspecto
        </Link>
      </header>
      <div className={css.contentWrapper}>
        <nav className={css.nav} data-open={navigationOpen} aria-label="Основная навигация">
          <div className={css.navShadow} />
          <NavLink to="/" end title="Чек-листы ТО" aria-label="Чек-листы ТО" className={css.navigationItem}>
            <HomeIcon width={16} height={16} aria-hidden="true" />
            {navigationOpen && <span>Чек-листы ТО</span>}
          </NavLink>
          <div className={css.navFooter}>
            <div className="flex-space-between">
              {navigationOpen && <LiveClock />}
              <Button
                size="default"
                type="default"
                ariaExpanded={navigationOpen}
                title={navigationOpen ? 'Свернуть меню' : 'Развернуть меню'}
                onClick={() => setNavigationOpen((open) => !open)}
                icon={<ArrowLeft aria-hidden="true" style={{ transform: `rotate(${navigationOpen ? 0 : 180}deg)` }} />}
              />
            </div>
          </div>
        </nav>
        <main id="main-content" tabIndex={-1} className={css.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
