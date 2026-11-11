interface SkeletonProps {
  width?: string | number;
  height?: number;
  radius?: number;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = 16,
  radius = 6,
  style,
}: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Skeleton width={180} height={20} />
        <Skeleton width={60} height={22} radius={5} />
      </div>
      <Skeleton width={90} height={32} />
      <Skeleton width="70%" height={14} />
      <Skeleton height={6} />
      <Skeleton height={36} radius={8} style={{ marginTop: 4 }} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      <td>
        <Skeleton width={200} height={16} />
      </td>
      <td>
        <Skeleton width={40} height={16} />
      </td>
      <td>
        <Skeleton width={40} height={16} />
      </td>
      <td>
        <Skeleton width={40} height={16} />
      </td>
      <td>
        <Skeleton width={40} height={16} />
      </td>
    </tr>
  );
}
