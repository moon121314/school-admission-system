export function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="loading">
      <div className="loading__spinner" />
      {label}
    </div>
  );
}
