'use client';

import { useActionState, useState } from 'react';
import { signUp } from '@/actions/auth';

export default function RegistroForm() {
  const [state, action, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await signUp(formData) ?? null;
    },
    null
  );

  const [strength, setStrength] = useState(0);

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = Math.min(4, Math.floor(e.target.value.length / 3));
    setStrength(n);
  }

  return (
    <form action={action} className="stack gap-4">
      <div className="field">
        <label className="label" htmlFor="fullName">Nombre completo</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          className="input"
          placeholder="Tu nombre y apellido"
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label className="label" htmlFor="email">Correo</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="tu@correo.com"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="input"
            placeholder="55 1234 5678"
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
          placeholder="Mínimo 8 caracteres"
          onChange={handlePasswordChange}
        />
        <div className="strength">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={i < strength ? 'on' : ''} />
          ))}
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="confirmPassword">Confirmar contraseña</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="input"
          placeholder="Repetí tu contraseña"
        />
      </div>

      <label className="terms">
        <input type="checkbox" required style={{ marginTop: '3px' }} />
        Acepto los{' '}
        <a href="#">términos</a>{' '}
        y la{' '}
        <a href="#">política de privacidad</a>{' '}
        de AgenciaTours.
      </label>

      {state?.error && (
        <div style={{ background: 'var(--danger-bg)', color: '#B91C1C', padding: '12px 14px', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-14)' }}>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary btn-block btn-lg"
      >
        {isPending ? 'Creando cuenta...' : <>Crear cuenta <span className="arrow">→</span></>}
      </button>
    </form>
  );
}
