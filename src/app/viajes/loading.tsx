export default function ViajesLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div style={{ background: 'linear-gradient(135deg,#0F1F4B,#16306E)', padding: 'var(--s-16) 0 var(--s-12)' }}>
        <div className="wrap">
          <div className="skeleton-line" style={{ width: 100, height: 12, background: 'rgba(255,255,255,.15)', borderRadius: 4 }} />
          <div className="skeleton-line" style={{ width: 300, height: 40, background: 'rgba(255,255,255,.15)', borderRadius: 8, marginTop: 12 }} />
          <div className="skeleton-line" style={{ width: 420, height: 16, background: 'rgba(255,255,255,.1)', borderRadius: 4, marginTop: 12 }} />
        </div>
      </div>
      <div className="wrap" style={{ paddingTop: 'var(--s-8)', paddingBottom: 'var(--s-24)' }}>
        <div style={{ display: 'flex', gap: 'var(--s-4)', marginBottom: 'var(--s-8)', flexWrap: 'wrap' }}>
          {[160, 200].map(w => (
            <div key={w} className="skeleton-block" style={{ width: w, height: 44, borderRadius: 10 }} />
          ))}
        </div>
        <div className="trip-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <div className="skeleton-block" style={{ aspectRatio: '16/10' }} />
              <div style={{ padding: 20 }}>
                <div className="skeleton-line" style={{ width: '75%', height: 16, borderRadius: 4 }} />
                <div className="skeleton-line" style={{ width: '55%', height: 13, borderRadius: 4, marginTop: 10 }} />
                <div className="skeleton-line" style={{ width: '40%', height: 13, borderRadius: 4, marginTop: 8 }} />
                <div style={{ height: 1, background: '#E2E8F0', margin: '16px 0 12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="skeleton-line" style={{ width: 90, height: 26, borderRadius: 4 }} />
                  <div className="skeleton-line" style={{ width: 100, height: 36, borderRadius: 999 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
