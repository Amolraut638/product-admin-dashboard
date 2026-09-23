'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * AppLayout — the persistent shell for all authenticated pages.
 * Rendered by (dashboard)/layout.tsx which wraps it with the auth guard.
 *
 * Structure:
 *   <div flex>
 *     <Sidebar />          ← w-60 desktop / drawer mobile
 *     <div flex-col flex-1>
 *       <Topbar />         ← h-14 sticky header
 *       <main>             ← scrollable content area
 *         {children}
 *       </main>
 *     </div>
 *   </div>
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
