export default function AdminLoading() {
  return (
    <>
      <div className="admin-topbar">
        <div>
          <div className="skeleton-line" style={{ width: 80, height: 11, borderRadius: 3 }} />
          <div className="skeleton-line" style={{ width: 200, height: 22, borderRadius: 6, marginTop: 6 }} />
        </div>
      </div>
      <div className="admin-content">
        <div className="stat-grid" style={{ marginBottom: 'var(--s-6)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat">
              <div className="skeleton-block" style={{ width: 40, height: 40, borderRadius: 10 }} />
              <div className="skeleton-line" style={{ width: 80, height: 36, borderRadius: 6, marginTop: 12 }} />
              <div className="skeleton-line" style={{ width: 100, height: 11, borderRadius: 3, marginTop: 8 }} />
            </div>
          ))}
        </div>
        <div className="skeleton-block" style={{ height: 300, borderRadius: 14 }} />
      </div>
    </>
  );
}
