import { ChangeEvent, CSSProperties } from 'react'
import css from './toggle.module.css'

interface IProps {
  name: string
  checked: boolean
  onChange: (v: boolean, name: string) => void
  size: 'default' | 'large'
  fontSize?: string
  style?: CSSProperties
  editing?: boolean
}

const Toggle = (props: IProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (props.editing === false) return

    props.onChange(e.target.checked, props.name)
  }

  return (
    <label
      data-size={props.size}
      style={{ fontSize: props.fontSize || '15px', ...props.style }}
      className={css.toggleSwitch}
    >
      <input type="checkbox" checked={props.checked} onChange={handleChange} name={props.name} />
      <span data-size={props.size} className={css.toggleSlider} />
    </label>
  )
}

export default Toggle
