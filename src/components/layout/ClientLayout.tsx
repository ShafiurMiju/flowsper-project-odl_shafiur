'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context';
import { Sidebar } from '@/components/layout';

// Pages that don't need sidebar/auth layout
const publicPages = ['/login'];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = publicPages.includes(pathname);

  return (
    <AuthProvider>
      {isPublicPage ? (
        children
      ) : (
        <div className="flex min-h-screen bg-gray-900">
          <Sidebar />
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
      )}
    </AuthProvider>
  );
}
