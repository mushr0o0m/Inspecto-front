import { CSSProperties, PropsWithChildren } from 'react'
import css from './card.module.css'

const Card = (props: PropsWithChildren<{ active?: boolean; onClick?: () => void; style?: CSSProperties }>) => {
  return (
    <div
      data-active={Boolean(props.active)}
      className={css.wrapper}
      onClick={props.onClick}
      data-clickable={Boolean(props.onClick)}
      style={props.style}
    >
      {props.children}
    </div>
  )
}

export default Card
