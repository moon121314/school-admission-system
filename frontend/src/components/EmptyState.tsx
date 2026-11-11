export function EmptyState({
  icon = "📭",
  title,
  text,
}: {
  icon?: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <h3 className="empty__title">{title}</h3>
      {text && <p className="empty__text">{text}</p>}
    </div>
  );
}
