import Tag, { ITagProps } from '../Tag'
import { PropsWithChildren } from 'react'
import CloseIcon from '../../../assets/icons/close.svg?react'

interface IProps extends ITagProps {
  onClose: () => void
}

const TagWithCloseIcon = ({ onClose, children, ...tagProps }: PropsWithChildren<IProps>) => {
  return (
    <Tag color={tagProps.color} pureColor={tagProps.pureColor} style={{ cursor: 'default', ...(tagProps.style || {}) }}>
      <div className="inline-flex-gap gap4 center">
        {children}
        <CloseIcon
          className="text-placeholder"
          style={{ cursor: 'pointer' }}
          onClick={(ev) => {
            ev.stopPropagation()
            onClose()
          }}
        />
      </div>
    </Tag>
  )
}

export default TagWithCloseIcon
