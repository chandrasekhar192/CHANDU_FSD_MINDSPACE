export default function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullPage = false,
}) {
  const spinnerClass = size === 'sm' ? 'spinner spinner-sm' : 'spinner';

  const content = (
    <div className="loading-container">
      <div className={spinnerClass} />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        {content}
      </div>
    );
  }

  return content;
}
