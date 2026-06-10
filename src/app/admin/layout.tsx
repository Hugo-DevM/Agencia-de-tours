import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/get-user';
import { prisma } from '@/lib/prisma';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, fullName: true, email: true },
  });

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/cuenta');
  }

  return (
    <div className="admin">
      <AdminSidebar profile={{ fullName: profile.fullName, email: profile.email }} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
