import css from './checkbox.module.css'
import { useId } from 'react'

interface IProps {
  checked?: boolean
  onCheck?: (val: boolean, name?: string) => void
  disabled?: boolean
  label?: string
  name?: string
}

const Checkbox = (props: IProps) => {
  const id = useId()

  return (
    <div
      className={css.wrapper}
      onClick={(ev) => {
        ev.stopPropagation()
      }}
    >
      <input
        className={css.input}
        type="checkbox"
        disabled={props.disabled}
        name={props.name}
        checked={props.checked}
        onChange={(val) => {
          props.onCheck?.(val.target.checked, props.name)
        }}
        id={id}
      />
      <label className={css.cbx} htmlFor={id}>
        <span>
          <svg width="12px" height="10px">
            <use href={`#check-${id}`} />
          </svg>
        </span>
        {props.label && <span className="text-nm">{props.label}</span>}
      </label>
      <svg className={css.svg}>
        <symbol id={`check-${id}`} viewBox="0 0 12 10">
          <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
        </symbol>
      </svg>
    </div>
  )
}
export default Checkbox
