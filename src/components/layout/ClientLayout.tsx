'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context';
import { Sidebar } from '@/components/layout';
import { cn } from '@/lib/utils';

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
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className={cn(
            "flex-1 ml-64 transition-all duration-300 ease-in-out",
            "lg:ml-64",
            "p-6 md:p-8"
          )}>
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      )}
    </AuthProvider>
  );
}
