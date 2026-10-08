import React from 'react'
import css from './textArea.module.css'
import cn from '@/utils/cn.ts'

export interface ITextAreaInputProps {
  error?: boolean
  placeHolder?: string
  disabled?: boolean
  inscription?: string
  value: string
  name: string
  onKeyDown?: (ev: React.KeyboardEvent<HTMLTextAreaElement>) => void

  onChange: (val: string, name: string) => void
}

const TextArea = (props: ITextAreaInputProps) => {
  return (
    <div className="flex-lines gap4" style={{ width: '100%', position: 'relative' }}>
      <textarea
        value={props.value}
        onChange={(ev) => props.onChange(ev.target.value, props.name)}
        disabled={Boolean(props.disabled)}
        data-error={Boolean(props.error)}
        className={cn(css.input, 'text-nm')}
        placeholder={props.placeHolder}
        onKeyDown={props.onKeyDown}
      />
      {Boolean(props.inscription) && (
        <p className="text-nm text-description" data-error={Boolean(props.error)}>
          {props.inscription}
        </p>
      )}
    </div>
  )
}

export default TextArea
