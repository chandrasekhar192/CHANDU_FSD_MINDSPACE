export default function PageHeader({
  title,
  description,
  action,
}) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-header-actions">{action}</div>}
    </div>
  );
}
