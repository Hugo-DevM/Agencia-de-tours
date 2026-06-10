export default function ConfiguracionPage() {
  const whatsappPhone = process.env.WHATSAPP_PHONE ?? '';

  return (
    <>
      <div className="admin-topbar">
        <div>
          <div className="eyebrow">Administración</div>
          <h1 style={{ fontSize: 'var(--fs-21)', fontWeight: 'var(--w-semibold)', margin: '4px 0 0' }}>
            Configuración
          </h1>
        </div>
      </div>

      <div className="admin-content">
        <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

          {/* WhatsApp */}
          <div className="form-card">
            <h4 className="h4" style={{ marginBottom: 'var(--s-4)' }}>WhatsApp de contacto</h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--r-lg)', background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: 'var(--s-4)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#16a34a">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              </svg>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: 0 }}>
                  {whatsappPhone ? `+${whatsappPhone}` : 'No configurado'}
                </p>
                <p style={{ fontSize: 11, color: '#16a34a', margin: '2px 0 0' }}>
                  Número actual · Desde la variable de entorno WHATSAPP_PHONE
                </p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 'var(--s-3)' }}>
              Para cambiar el número de WhatsApp, actualiza la variable de entorno <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>WHATSAPP_PHONE</code> en tu archivo <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>.env.local</code> y reinicia el servidor.
            </p>

            <div style={{ background: '#F8F9FB', borderRadius: 'var(--r-lg)', padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
              <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: 11 }}># .env.local</p>
              <p style={{ margin: 0 }}>WHATSAPP_PHONE=521XXXXXXXXXX</p>
            </div>

            <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 'var(--s-3)' }}>
              Formato: código de país + número sin espacios ni guiones. Ejemplo México: <code style={{ fontFamily: 'monospace' }}>5214771234567</code>
            </p>
          </div>

          {/* Info card */}
          <div className="form-card" style={{ background: '#FAFAFA' }}>
            <h4 className="h4" style={{ marginBottom: 'var(--s-3)' }}>Configuración de apartados por viaje</h4>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
              El depósito mínimo, el plazo de apartado y el límite de asientos reservados se configuran individualmente en cada viaje desde el panel de edición de viajes.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
