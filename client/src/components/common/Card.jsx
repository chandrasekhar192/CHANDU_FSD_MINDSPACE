export default function Card({
  children,
  padded = true,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'card',
    padded ? 'card-padded' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
}
