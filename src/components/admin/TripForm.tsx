'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createTrip, updateTrip } from '@/actions/trips';

const PRESET_CATEGORIES = ['Playa', 'Aventura', 'Colonial', 'Pueblos mágicos', 'Naturaleza', 'Cultural', 'Familiar'];

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]       = useState(false);
  const [custom, setCustom]   = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function select(v: string) { onChange(v); setOpen(false); }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'left',
          borderColor: open ? 'var(--blue-600, #2563eb)' : undefined,
          boxShadow: open ? '0 0 0 3px rgba(30,58,138,0.10)' : undefined,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: value ? '#F97316' : '#94a3b8', flexShrink: 0 }}>
          <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.71-7.71a1 1 0 0 0 0-1.41L12 2Z"/>
          <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
        <span style={{ flex: 1, color: value ? 'var(--ink)' : 'var(--ink-faint)', fontWeight: value ? 500 : 400 }}>
          {value || 'Selecciona una categoría…'}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '4px 0', overflow: 'hidden' }}>
          {/* Preset options */}
          {PRESET_CATEGORIES.map(cat => {
            const isActive = cat === value;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => select(cat)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', border: 'none', cursor: 'pointer', background: isActive ? '#FFF7ED' : 'transparent', color: isActive ? '#C2410C' : 'var(--ink)', fontSize: 'var(--fs-13)', fontWeight: isActive ? 600 : 400, textAlign: 'left' }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#F97316' : '#CBD5E1'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.71-7.71a1 1 0 0 0 0-1.41L12 2Z"/>
                  <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
                {cat}
                {isActive && (
                  <svg style={{ marginLeft: 'auto' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                )}
              </button>
            );
          })}

          {/* Divider + custom input */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
          <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
            <input
              type="text"
              className="input"
              style={{ flex: 1, height: 32, fontSize: 'var(--fs-12)', padding: '0 10px' }}
              placeholder="Categoría personalizada…"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { select(custom.trim()); setCustom(''); } }}
            />
            <button
              type="button"
              onClick={() => { if (custom.trim()) { select(custom.trim()); setCustom(''); } }}
              style={{ height: 32, padding: '0 12px', borderRadius: 'var(--r-md)', background: '#0F1F4B', color: '#fff', fontSize: 'var(--fs-12)', fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              + Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const BusMiniPreview = dynamic(() => import('./BusMiniPreview'), { ssr: false });

interface ItineraryItem {
  day: number;
  title: string;
}

type BusType = 'SINGLE_DOOR' | 'DOUBLE_DOOR' | 'DOUBLE_DECKER';
type BathroomPosition = 'MIDDLE' | 'BACK';

const BATHROOM_DEFAULT: Record<BusType, BathroomPosition> = {
  SINGLE_DOOR:   'BACK',
  DOUBLE_DOOR:   'MIDDLE',
  DOUBLE_DECKER: 'BACK',
};

interface TripData {
  id: string;
  title: string;
  destination: string;
  description: string;
  itinerary: unknown;
  coverImage: string;
  gallery: string[];
  departureDate: Date;
  returnDate: Date;
  pricePerSeat: unknown;
  totalSeats: number;
  busType: BusType;
  bathroomPosition?: BathroomPosition | null;
  category?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'CANCELLED';
  minimumDeposit?: unknown | null;
  depositDeadlineHours?: number | null;
  maxReservedPercent?: number | null;
}

interface TripFormProps {
  trip?: TripData;
}

async function uploadImage(file: File, tripName: string): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  body.append('tripName', tripName);
  const res = await fetch('/api/upload', { method: 'POST', body });
  if (!res.ok) throw new Error('Failed to upload image');
  const { publicUrl } = await res.json() as { publicUrl: string };
  return publicUrl;
}

function parseItinerary(raw: unknown): ItineraryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is { day: number; title: string } =>
      typeof item === 'object' && item !== null && 'day' in item && 'title' in item
    )
    .map((item) => ({ day: Number(item.day), title: String(item.title) }));
}

export default function TripForm({ trip }: TripFormProps) {
  const isEdit = Boolean(trip);

  const [title, setTitle] = useState(trip?.title ?? '');
  const [destination, setDestination] = useState(trip?.destination ?? '');
  const [description, setDescription] = useState(trip?.description ?? '');
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(parseItinerary(trip?.itinerary));
  const [coverImage, setCoverImage] = useState<string>(trip?.coverImage ?? '');
  const [gallery, setGallery] = useState<string[]>(trip?.gallery ?? []);
  const [departureDate, setDepartureDate] = useState(
    trip?.departureDate ? new Date(trip.departureDate).toISOString().slice(0, 10) : ''
  );
  const [returnDate, setReturnDate] = useState(
    trip?.returnDate ? new Date(trip.returnDate).toISOString().slice(0, 10) : ''
  );
  const [pricePerSeat, setPricePerSeat] = useState(
    trip?.pricePerSeat != null ? String(trip.pricePerSeat) : ''
  );
  const [totalSeats, setTotalSeats] = useState(trip?.totalSeats ?? 40);
  const [busType, setBusType] = useState<BusType>(trip?.busType ?? 'SINGLE_DOOR');
  const [bathroomPosition, setBathroomPosition] = useState<BathroomPosition>(
    trip?.bathroomPosition ?? BATHROOM_DEFAULT[trip?.busType ?? 'SINGLE_DOOR']
  );
  const [category, setCategory] = useState(trip?.category ?? '');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'CANCELLED'>(trip?.status ?? 'DRAFT');
  // Apartado settings
  const [apartadoEnabled, setApartadoEnabled] = useState(trip?.minimumDeposit != null);
  const [minimumDeposit, setMinimumDeposit] = useState(
    trip?.minimumDeposit != null ? String(trip.minimumDeposit) : '500'
  );
  const [depositDeadlineHours, setDepositDeadlineHours] = useState(
    trip?.depositDeadlineHours ?? 24
  );
  const [maxReservedPercent, setMaxReservedPercent] = useState(
    trip?.maxReservedPercent ?? 40
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galUploading, setGalUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galInputRef   = useRef<HTMLInputElement>(null);
  const errorRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  // Al cambiar tipo de bus, actualizar posición de baño al default correspondiente
  useEffect(() => {
    setBathroomPosition(BATHROOM_DEFAULT[busType]);
  }, [busType]);

  // Itinerary helpers
  function addDay() {
    const nextDay = itinerary.length > 0 ? Math.max(...itinerary.map((i) => i.day)) + 1 : 1;
    setItinerary([...itinerary, { day: nextDay, title: '' }]);
  }

  function updateItinTitle(idx: number, value: string) {
    setItinerary(itinerary.map((item, i) => (i === idx ? { ...item, title: value } : item)));
  }

  function removeItin(idx: number) {
    const updated = itinerary.filter((_, i) => i !== idx).map((item, i) => ({ ...item, day: i + 1 }));
    setItinerary(updated);
  }

  // Cover image
  async function handleCoverFile(file: File) {
    setCoverUploading(true);
    try {
      const url = await uploadImage(file, title);
      setCoverImage(url);
    } catch {
      setError('Error al subir imagen de portada.');
    } finally {
      setCoverUploading(false);
    }
  }

  // Gallery
  async function handleGalleryFile(file: File) {
    setGalUploading(true);
    try {
      const url = await uploadImage(file, title);
      setGallery((prev) => [...prev, url]);
    } catch {
      setError('Error al subir imagen de galería.');
    } finally {
      setGalUploading(false);
    }
  }

  function removeGalleryImage(idx: number) {
    setGallery(gallery.filter((_, i) => i !== idx));
  }

  // Submit
  async function handleSubmit(targetStatus: typeof status) {
    setError(null);

    const price = parseFloat(pricePerSeat);
    if (!pricePerSeat || isNaN(price) || price <= 0) {
      setError('El precio por asiento debe ser mayor a 0.');
      return;
    }

    setIsPending(true);

    const finalStatus = targetStatus;

    const data = {
      title,
      destination,
      description,
      itinerary,
      coverImage,
      gallery,
      departureDate,
      returnDate,
      pricePerSeat,
      totalSeats,
      busType,
      bathroomPosition,
      category,
      status: finalStatus,
      minimumDeposit:       apartadoEnabled ? minimumDeposit : null,
      depositDeadlineHours: depositDeadlineHours,
      maxReservedPercent:   maxReservedPercent,
    };

    try {
      if (isEdit && trip) {
        await updateTrip(trip.id, data);
      } else {
        await createTrip(data);
      }
    } catch (err: unknown) {
      // redirect() throws — ignore NEXT_REDIRECT
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') return;
      const msg = err instanceof Error ? err.message : 'Error al guardar viaje.';
      setError(msg);
      setIsPending(false);
    }
  }

  const rowCount = Math.ceil(totalSeats / 4);

  return (
    <>
      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <div className="eyebrow">
            <a href="/admin/viajes" style={{ color: 'inherit' }}>Viajes</a>
            <span style={{ color: 'var(--ink-faint)' }}>/</span>
            {isEdit ? trip?.title : 'Nuevo'}
          </div>
          <h1 style={{ fontSize: 'var(--fs-21)', fontWeight: 'var(--w-semibold)', margin: '4px 0 0' }}>
            {isEdit ? 'Editar viaje' : 'Crear nuevo viaje'}
          </h1>
        </div>
      </div>

      <div className="admin-content">
        {error && (
          <div
            ref={errorRef}
            style={{
              background: 'var(--danger-bg)',
              color: '#B91C1C',
              padding: '12px 16px',
              borderRadius: 'var(--r-md)',
              marginBottom: 'var(--s-5)',
              fontSize: 'var(--fs-14)',
            }}
          >
            {error}
          </div>
        )}

        <div className="form-grid">
          {/* Left column */}
          <div>
            {/* Info general */}
            <div className="form-card">
              <h4 className="h4">
                <span className="num">01</span>
                Información general
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--s-4)', marginBottom: 'var(--s-4)' }}>
                <div className="field">
                  <label className="label">Título del viaje</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Ej. Cancún Todo Incluido"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label className="label">Destino</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Ej. Cancún, QR"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Categoría */}
              <div className="field" style={{ marginBottom: 'var(--s-5)' }}>
                <label className="label">Categoría del viaje</label>
                <CategorySelect value={category} onChange={setCategory} />
              </div>

              <div className="field">
                <label className="label">Descripción</label>
                <textarea
                  className="textarea"
                  placeholder="Descripción completa del viaje..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {/* Itinerary */}
            <div className="form-card">
              <h4 className="h4">
                <span className="num">02</span>
                Itinerario
              </h4>

              {itinerary.map((item, idx) => (
                <div key={idx} className="itin-row">
                  <div className="itin-day">
                    <span className="d">Día</span>
                    <span className="n">{item.day}</span>
                  </div>
                  <input
                    className="input"
                    type="text"
                    placeholder={`Actividad del día ${item.day}`}
                    value={item.title}
                    onChange={(e) => updateItinTitle(idx, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeItin(idx)}
                    style={{ flexShrink: 0, color: 'var(--danger)' }}
                    title="Eliminar día"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={addDay}
                style={{ marginTop: itinerary.length > 0 ? 4 : 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Agregar día
              </button>
            </div>

            {/* Bus config — moved here so right column stays compact */}
            <div className="seatcfg">
              <h4 className="h4">
                <span className="num">05</span>
                Configuración del autobús
              </h4>

              <div className="field" style={{ marginBottom: 'var(--s-4)' }}>
                <label className="label">Total de asientos</label>
                <input
                  className="input"
                  type="number"
                  min="4"
                  max="100"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(Math.max(4, parseInt(e.target.value) || 4))}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>

              <div className="field" style={{ marginBottom: 'var(--s-4)' }}>
                <label className="label">Tipo de autobús</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {([
                    { value: 'SINGLE_DOOR',   label: '1 Puerta',     desc: 'Puerta delantera' },
                    { value: 'DOUBLE_DOOR',   label: '2 Puertas',    desc: 'Delantera + media' },
                    { value: 'DOUBLE_DECKER', label: 'Doble planta', desc: '2 niveles' },
                  ] as { value: BusType; label: string; desc: string }[]).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBusType(value)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--r-md)',
                        border: busType === value ? '2px solid var(--blue-600)' : '1.5px solid var(--border)',
                        background: busType === value ? 'var(--blue-50)' : 'var(--surface)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 'var(--fs-13)', fontWeight: 'var(--w-semibold)', color: busType === value ? 'var(--blue-700)' : 'var(--ink)' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
                        {desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Posición del baño */}
              <div className="field" style={{ marginBottom: 'var(--s-4)' }}>
                <label className="label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5, color: 'var(--ink-subtle)' }}>
                    <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4 3 4 3 4 5v2a1 1 0 0 0 1 1h5zm0 0h6m-6 0v12a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V6m-6 4h6"/>
                  </svg>
                  Posición del baño
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {([
                    { value: 'MIDDLE' as BathroomPosition, label: 'A la mitad', desc: 'Zona central del camión' },
                    { value: 'BACK'   as BathroomPosition, label: 'Al final',   desc: 'Parte trasera del camión' },
                  ]).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBathroomPosition(value)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--r-md)',
                        border: bathroomPosition === value ? '2px solid var(--blue-600)' : '1.5px solid var(--border)',
                        background: bathroomPosition === value ? 'var(--blue-50)' : 'var(--surface)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 'var(--fs-13)', fontWeight: 'var(--w-semibold)', color: bathroomPosition === value ? 'var(--blue-700)' : 'var(--ink)' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
                        {desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="cfg-result">
                {rowCount} filas · {totalSeats} asientos · distribución 2+2 · baño {bathroomPosition === 'MIDDLE' ? 'a la mitad' : 'al final'}
              </div>

              <div className="cfg-preview">
                <BusMiniPreview totalSeats={totalSeats} busType={busType} bathroomPosition={bathroomPosition} />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            {/* Images */}
            <div className="form-card">
              <h4 className="h4">
                <span className="num">03</span>
                Imágenes
              </h4>

              {/* Cover image */}
              <div className="field" style={{ marginBottom: 'var(--s-4)' }}>
                <label className="label">Imagen de portada</label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleCoverFile(file);
                  }}
                />
                {coverImage ? (
                  <div style={{ position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden', aspectRatio: '16/9' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt="Portada"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(15,31,75,.7)', color: '#fff',
                        border: 'none', borderRadius: '50%',
                        width: 28, height: 28, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`drop${dragOver ? ' dragover' : ''}`}
                    onClick={() => coverInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) await handleCoverFile(file);
                    }}
                  >
                    <div className="ico">
                      {coverUploading ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      )}
                    </div>
                    <p style={{ fontWeight: 'var(--w-semibold)', fontSize: 'var(--fs-14)', marginBottom: 4 }}>
                      {coverUploading ? 'Subiendo…' : 'Arrastra o haz clic'}
                    </p>
                    <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-faint)' }}>
                      JPG, PNG, WebP · Máx 5MB
                    </p>
                  </div>
                )}
              </div>

              {/* Gallery */}
              <div className="field">
                <label className="label">Galería</label>
                <input
                  ref={galInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    for (const file of files) {
                      await handleGalleryFile(file);
                    }
                    e.target.value = '';
                  }}
                />
                <div className="gal-grid">
                  {gallery.map((url, idx) => (
                    <div key={idx} className="gal-cell">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Imagen ${idx + 1}`} />
                      <button
                        type="button"
                        className="rm"
                        onClick={() => removeGalleryImage(idx)}
                        title="Eliminar"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="gal-add"
                    onClick={() => galInputRef.current?.click()}
                    disabled={galUploading}
                    title="Agregar imagen"
                  >
                    {galUploading ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Dates and price */}
            <div className="form-card">
              <h4 className="h4">
                <span className="num">04</span>
                Fechas y precio
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-4)', marginBottom: 'var(--s-4)' }}>
                <div className="field">
                  <label className="label">Salida</label>
                  <input
                    className="input"
                    type="date"
                    value={departureDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    onKeyDown={(e) => e.preventDefault()}
                    required
                  />
                </div>
                <div className="field">
                  <label className="label">Regreso</label>
                  <input
                    className="input"
                    type="date"
                    value={returnDate}
                    min={departureDate || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setReturnDate(e.target.value)}
                    onKeyDown={(e) => e.preventDefault()}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">Precio por asiento (MXN)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="Ej. 3500"
                  min="1"
                  step="1"
                  value={pricePerSeat}
                  onChange={(e) => setPricePerSeat(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  required
                />
              </div>
            </div>

            {/* Apartado settings */}
            <div className="form-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s-4)' }}>
                <h4 className="h4" style={{ margin: 0 }}>
                  <span className="num">06</span>
                  Pago en apartado
                </h4>
                <button
                  type="button"
                  onClick={() => setApartadoEnabled(e => !e)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: apartadoEnabled ? '#FFF7ED' : '#F1F5F9',
                    color: apartadoEnabled ? '#ea580c' : '#64748b',
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: apartadoEnabled ? '#f97316' : '#cbd5e1', display: 'inline-block' }} />
                  {apartadoEnabled ? 'Habilitado' : 'Deshabilitado'}
                </button>
              </div>

              {!apartadoEnabled && (
                <p style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                  Los clientes deberán pagar el total al reservar. Activa esta opción para permitir apartar con un depósito mínimo.
                </p>
              )}

              {apartadoEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
                  <div className="field">
                    <label className="label">Depósito mínimo (MXN)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: 14 }}>$</span>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        step="1"
                        value={minimumDeposit}
                        onChange={e => setMinimumDeposit(e.target.value)}
                        onWheel={e => e.currentTarget.blur()}
                        style={{ paddingLeft: 26 }}
                        placeholder="500"
                      />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                      Monto mínimo por asiento para apartar. El cliente paga el resto después.
                    </p>
                  </div>

                  <div className="field">
                    <label className="label">Plazo para primer abono (horas)</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      max="168"
                      value={depositDeadlineHours}
                      onChange={e => setDepositDeadlineHours(Math.max(1, parseInt(e.target.value) || 24))}
                      onWheel={e => e.currentTarget.blur()}
                    />
                    <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                      Horas que tiene el cliente para hacer su primer abono antes de que se liberen los asientos.
                    </p>
                  </div>

                  <div className="field">
                    <label className="label">Máximo de asientos apartados (%)</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="100"
                      value={maxReservedPercent}
                      onChange={e => setMaxReservedPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 40)))}
                      onWheel={e => e.currentTarget.blur()}
                    />
                    <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                      Porcentaje máximo de asientos que pueden estar en estado "Apartado" al mismo tiempo. 0 = sin límite.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="form-card">
              <h4 className="h4">
                <span className="num">07</span>
                Estado
              </h4>

              <div className="status-seg">
                {(['DRAFT', 'ACTIVE', 'CANCELLED'] as const).map((s) => {
                  const dotColor =
                    s === 'ACTIVE' ? 'var(--success)' :
                    s === 'CANCELLED' ? 'var(--danger)' :
                    'var(--ink-subtle)';
                  const label =
                    s === 'ACTIVE' ? 'Activo' :
                    s === 'CANCELLED' ? 'Cancelado' :
                    'Borrador';
                  return (
                    <button
                      key={s}
                      type="button"
                      data-active={status === s}
                      data-st={s.toLowerCase()}
                      onClick={() => setStatus(s)}
                    >
                      <span className="d" style={{ background: dotColor }} />
                      {label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 'var(--s-5)' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleSubmit(status)}
                  disabled={isPending}
                >
                  {isPending ? 'Guardando…' : isEdit ? 'Actualizar' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
