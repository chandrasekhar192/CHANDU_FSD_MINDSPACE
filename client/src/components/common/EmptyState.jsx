import Button from './Button';

export default function EmptyState({
  icon = '🌱',
  title = 'Nothing here yet',
  description = 'Get started by creating your first entry.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
