type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  visible: boolean
  onToggle: () => void
}

export function PasswordInput({
  visible,
  onToggle,
  ...rest
}: PasswordInputProps) {
  return (
    <div className="input-with-toggle">
      <input
        {...rest}
        type={visible ? 'text' : 'password'}
      />
      <button
        type="button"
        className={`toggle-btn ${visible ? 'visible' : ''}`}
        onClick={onToggle}
        tabIndex={-1}
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.87 18.82a10.05 10.05 0 0 1-1.27 2.81" />
            <path d="M9.87 14.82A6.03 6.03 0 0 1 9 14c0-2.21 1.79-4 4-4 1.17 0 2.2.58 2.87 1.5" />
            <path d="m15 12-3-3-3 3" />
            <path d="M12 19c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  )
}
