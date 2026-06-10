/**
 * Translates Supabase Auth error messages (English) to Spanish.
 */
export function translateAuthError(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials'))
    return 'Correo o contraseña incorrectos.';

  if (msg.includes('email not confirmed'))
    return 'Confirma tu correo antes de iniciar sesión.';

  if (
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('already exists')
  )
    return 'Este correo ya está registrado. Inicia sesión o usa otro correo.';

  if (msg.includes('password should be at least'))
    return 'La contraseña debe tener al menos 8 caracteres.';

  if (msg.includes('password is too weak') || msg.includes('weak password'))
    return 'La contraseña es demasiado débil. Usa letras, números y símbolos.';

  if (msg.includes('unable to validate email') || msg.includes('invalid email'))
    return 'El formato del correo no es válido.';

  if (msg.includes('email rate limit') || msg.includes('rate limit'))
    return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';

  if (msg.includes('for security purposes, you can only request this after'))
    return 'Por seguridad, espera unos segundos antes de volver a intentarlo.';

  if (msg.includes('email link is invalid or has expired') || msg.includes('token has expired'))
    return 'El enlace expiró o ya fue usado. Solicita uno nuevo.';

  if (msg.includes('user not found'))
    return 'No existe una cuenta con ese correo.';

  if (msg.includes('network') || msg.includes('fetch'))
    return 'Error de conexión. Verifica tu internet e inténtalo de nuevo.';

  // Fallback
  return 'Ocurrió un error. Inténtalo de nuevo.';
}
