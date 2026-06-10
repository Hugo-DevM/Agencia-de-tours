'use client';

import { useActionState } from 'react';
import { signIn } from '@/actions/auth';

interface Props {
  next?: string;
}

export default function LoginForm({ next }: Props) {
  const [state, action, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await signIn(formData) ?? null;
    },
    null
  );

  return (
    <form action={action} className="stack gap-4">
      <input type="hidden" name="next" value={next ?? ''} />

      <div className="field">
        <label className="label" htmlFor="email">Correo electrónico</label>
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
        <label className="label" htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
        />
      </div>

      <div className="check-row">
        <label>
          <input type="checkbox" defaultChecked /> Recordarme
        </label>
        <a href="#">¿Olvidaste tu contraseña?</a>
      </div>

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
        {isPending ? 'Iniciando sesión...' : <>Iniciar sesión <span className="arrow">→</span></>}
      </button>

      <div className="divider">o continuá con</div>

      <button type="button" className="social-btn">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 11v2.8h6.5c-.3 1.7-1.9 4.9-6.5 4.9-3.9 0-7.1-3.2-7.1-7.2S8.1 4.3 12 4.3c2.2 0 3.7.9 4.5 1.7l3-3C17.6 1.2 15 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.9 0 11.5-4.9 11.5-11.7 0-.8-.1-1.4-.2-2H12z"/>
        </svg>
        Continuar con Google
      </button>
    </form>
  );
}
