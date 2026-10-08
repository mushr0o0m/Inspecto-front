import css from './threeDotsLoader.module.css'

interface IProps {
  inscription?: string
  color?: string
}

const ThreeDotsLoader = (props: IProps) => {
  return (
    <div className="flex-lines" style={{ alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div className={css.loader} style={{ color: props.color }} />
      {props.inscription && (
        <p className="text-nm text-primary text-center" style={{ whiteSpace: 'pre' }}>
          {props.inscription}
        </p>
      )}
    </div>
  )
}

export default ThreeDotsLoader
