import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────
export const signUpSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  fullName: z.string().min(2, 'Ingresa tu nombre completo').max(100),
  phone:    z.string().max(20).optional(),
});

export const signInSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

// ── Seat lock ─────────────────────────────────────────────────
export const lockSeatsSchema = z.object({
  tripId:      z.string().min(1),
  seatNumbers: z
    .array(z.number().int().positive())
    .min(1, 'Selecciona al menos un asiento')
    .max(6, 'Máximo 6 asientos por reservación'),
});

// ── Checkout ──────────────────────────────────────────────────
export const createPaymentIntentSchema = z.object({
  tripId:      z.string().min(1),
  seatNumbers: z.array(z.number().int().positive()).min(1).max(6),
  lockId:      z.string().min(1),
});

// ── Booking status ────────────────────────────────────────────
export const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'AWAITING_PAYMENT', 'RESERVED', 'CONFIRMED', 'CANCELLED']),
});

// ── Reserve cash (apartado en efectivo) ───────────────────────
export const reserveCashSchema = z.object({
  tripId:      z.string().min(1),
  seatNumbers: z.array(z.number().int().positive()).min(1).max(6),
  lockId:      z.string().min(1),
});

// ── Trip form ─────────────────────────────────────────────────
export const tripInputSchema = z.object({
  title:         z.string().min(3, 'El título es muy corto').max(120),
  destination:   z.string().min(2).max(80),
  description:   z.string().min(10, 'Agrega una descripción').max(3000),
  itinerary:     z.array(z.object({
    day:   z.number().int().positive(),
    title: z.string().min(1),
    description: z.string().optional(),
  })),
  coverImage:    z.string().url().or(z.literal('')),
  gallery:       z.array(z.string().url()),
  departureDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  returnDate:    z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  pricePerSeat:  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido'),
  totalSeats:    z.number().int().min(1).max(100),
  busType:       z.enum(['SINGLE_DOOR', 'DOUBLE_DOOR', 'DOUBLE_DECKER']),
  status:        z.enum(['DRAFT', 'ACTIVE', 'CANCELLED']),
});

export type TripInputSchema = z.infer<typeof tripInputSchema>;
