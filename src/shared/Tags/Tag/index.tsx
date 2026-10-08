import { CSSProperties, PropsWithChildren } from 'react'
import css from './tag.module.css'

export type TTagColor = 'geekblue' | 'green' | 'orange' | 'gray' | 'red' | 'cyan' | 'purple' | 'blue' | 'doted'

export interface ITagProps {
  color?: TTagColor
  pureColor?: string
  style?: CSSProperties
  onClick?: () => void
}

const Tag = (props: PropsWithChildren<ITagProps>) => {
  let style: CSSProperties = {}
  if (props.style) style = { ...props.style }
  if (props.pureColor) {
    style['borderColor'] = props.pureColor
    style['backgroundColor'] = props.pureColor + '12'
    style['color'] = props.pureColor
  }

  return (
    <div className={css.wrapper} data-color={props.color} style={style} onClick={props.onClick}>
      {props.children}
    </div>
  )
}

export default Tag
