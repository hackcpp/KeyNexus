type SpinnerProps = {
  text?: string
  className?: string
}

export function Spinner({ text = '加载中...', className }: SpinnerProps) {
  return (
    <div className={`loading ${className ?? ''}`}>
      <div className="loading-spinner" />
      <span>{text}</span>
    </div>
  )
}
