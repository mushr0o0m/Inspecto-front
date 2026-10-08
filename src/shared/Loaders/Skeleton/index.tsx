import { CSSProperties, PropsWithChildren } from 'react'
import css from './skeleton.module.css'

interface IProps {
  height: string
  width: string
  style?: CSSProperties
  loading?: boolean
}

const Skeleton = ({ loading = true, ...props }: PropsWithChildren<IProps>) => {
  if (loading) {
    return <div className={css.wrapper} style={{ width: props.width, height: props.height, ...props?.style }} />
  }

  return <>{props.children}</>
}

export default Skeleton
