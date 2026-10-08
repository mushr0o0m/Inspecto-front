import { ReactNode } from 'react'
import css from './button.module.css'

export interface IButtonProps {
  icon?: ReactNode
  size: 'large' | 'default' | 'small'
  type: 'primary' | 'default' | 'tetriary' | 'dim'
  ghost?: boolean
  isLink?: boolean
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  text?: string
  danger?: boolean
  onClick?: () => void
  buttonType?: 'submit' | 'reset' | 'button'
  className?: string
  dataActive?: boolean
  children?: ReactNode
  title?: string
  ariaLabel?: string
  ariaExpanded?: boolean
}

const Button = (props: IButtonProps) => {
  return (
    <button
      className={`${css.button} ${props.className || ''}`}
      data-size={props.size}
      data-type={props.type}
      data-loading={Boolean(props.loading)}
      data-full-width={Boolean(props.fullWidth)}
      data-ghost={Boolean(props.ghost)}
      data-link={Boolean(props.isLink)}
      data-icon-only={Boolean(props.icon) && !props.text && !props.children}
      data-danger={Boolean(props.danger)}
      data-active={Boolean(props.dataActive)}
      disabled={Boolean(props.disabled)}
      onClick={props.onClick}
      type={props.buttonType || 'button'}
      title={props.title}
      aria-label={props.ariaLabel || props.title}
      aria-expanded={props.ariaExpanded}
    >
      {props.icon || null}
      {props.children
        ? props.children
        : props.text && (
            <span
              className={css.text}
              data-size={props.size}
              data-type={props.type}
              data-ghost={Boolean(props.ghost)}
              data-disabled={Boolean(props.disabled)}
            >
              {props.text}
            </span>
          )}
    </button>
  )
}

export default Button
