import { memo, useEffect, useState } from 'react'

const LiveClock = () => {
  const [time, setTime] = useState(getCurrentTimeString())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTimeString())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <span className="text-caption text-secondary" style={{ flexShrink: 0 }}>
      {time}
    </span>
  )
}

const getCurrentTimeString = () => {
  const dt = new Date()

  const p = (v: number) => v.toString().padStart(2, '0')
  return `${p(dt.getDate())}.${p(dt.getMonth() + 1)}.${dt.getFullYear()}, ${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`
}

export default memo(LiveClock)
