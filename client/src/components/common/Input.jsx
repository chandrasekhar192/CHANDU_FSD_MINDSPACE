export default function Input({
  label,
  error,
  icon,
  type = 'text',
  id,
  className = '',
  multiline = false,
  rows = 4,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div className="form-input-wrapper">
        {icon && <span className="form-input-icon">{icon}</span>}
        {multiline ? (
          <textarea
            id={inputId}
            rows={rows}
            className={`form-input ${icon ? 'has-icon' : ''} ${error ? 'form-input-error' : ''} ${className}`}
            {...props}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            className={`form-input ${icon ? 'has-icon' : ''} ${error ? 'form-input-error' : ''} ${className}`}
            {...props}
          />
        )}
      </div>
      {error && <span className="form-error-text">{error}</span>}
    </div>
  );
}
