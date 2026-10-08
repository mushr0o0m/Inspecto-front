import { forwardRef } from 'react'
import { CSSProperties, HTMLInputTypeAttribute, ReactNode } from 'react'
import css from './textInput.module.css'
import cn from '@/utils/cn.ts'

export interface ITextInputProps {
  error?: boolean
  inscription?: string
  tooltipText?: string
  icon?: ReactNode
  placeHolder?: string
  type?: HTMLInputTypeAttribute
  disabled?: boolean
  inputStyle?: CSSProperties
  value: string
  name: string
  onChange: (val: string, name: string) => void
  size?: 'default' | 'small' | 'large'
  onBlur?: () => void
}

const TextInput = forwardRef<HTMLInputElement, ITextInputProps>((props, ref) => {
  return (
    <div className="flex-lines gap4" style={{ width: '100%', position: 'relative' }}>
      {Boolean(props.icon) && (
        <div className={css.icon} data-error={Boolean(props.error)} data-size={props.size || 'default'}>
          {props.icon}
        </div>
      )}
      <input
        ref={ref}
        value={props.value}
        onChange={(ev) => props.onChange(ev.target.value, props.name)}
        name={props.name}
        disabled={Boolean(props.disabled)}
        data-error={Boolean(props.error)}
        data-size={props.size || 'default'}
        className={cn(css.input, 'text-nm')}
        style={props.inputStyle}
        placeholder={props.placeHolder}
        type={props.type}
        data-with-icon={Boolean(props.icon)}
        onBlur={props.onBlur}
      />
      {Boolean(props.inscription) && (
        <p className={cn('text-nm', css.inscription)} data-error={Boolean(props.error)}>
          {props.inscription}
        </p>
      )}
    </div>
  )
})

export default TextInput
