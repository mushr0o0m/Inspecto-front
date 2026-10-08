type Value = string | number | boolean | undefined | null
type Mapping = Record<string, unknown>
type Argument = Value | Mapping

/** Implementation of the "classnames" library method */
const cn = (...args: Argument[]): string => {
  const classes: string[] = []

  for (const arg of args) {
    if (typeof arg === 'string' || typeof arg === 'number') {
      classes.push(String(arg))
    } else if (typeof arg === 'object' && arg !== null) {
      for (const [className, condition] of Object.entries(arg)) {
        if (condition) {
          classes.push(className)
        }
      }
    }
  }

  return classes.join(' ')
}

export default cn
