import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TripForm from '@/components/admin/TripForm';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const trip = await prisma.trip.findUnique({ where: { id }, select: { title: true } });
  return { title: trip ? `Editar: ${trip.title}` : 'Editar viaje' };
}

export default async function EditTripPage({ params }: Props) {
  const { id } = await params;

  const trip = await prisma.trip.findUnique({ where: { id } });

  if (!trip) {
    notFound();
  }

  return (
    <TripForm
      trip={{
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        description: trip.description,
        itinerary: trip.itinerary,
        coverImage: trip.coverImage,
        gallery: trip.gallery,
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
        pricePerSeat: trip.pricePerSeat.toString(),
        totalSeats: trip.totalSeats,
        busType: trip.busType,
        category: trip.category,
        status: trip.status,
        minimumDeposit:       trip.minimumDeposit,
        depositDeadlineHours: trip.depositDeadlineHours,
        maxReservedPercent:   trip.maxReservedPercent,
      }}
    />
  );
}
