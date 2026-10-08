const steps = ['Загрузите шахматку', 'Проверьте данные', 'Подготовьте чек-лист']
export default function FlowSteps({ step }: { step: number }) {
  return (
    <ol className="flow-steps" aria-label="Этапы подготовки чек-листа">
      {steps.map((label, index) => (
        <li
          key={label}
          data-state={index < step ? 'done' : index === step ? 'active' : 'next'}
          aria-current={index === step ? 'step' : undefined}
        >
          <span className="step-number">{index < step ? '✓' : `0${index + 1}`}</span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  )
}
