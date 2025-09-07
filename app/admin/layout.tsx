'use client';

import { AdminWagmiProvider } from '@/lib/wagmi/AdminWagmiProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminWagmiProvider>
      {children}
    </AdminWagmiProvider>
  );
}