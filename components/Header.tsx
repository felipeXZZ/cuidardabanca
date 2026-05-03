'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface HeaderProps {
  user: { id: string; email: string };
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] sticky top-0 z-30">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[#0F172A] dark:text-[#F1F5F9] text-sm hidden sm:block tracking-tight">
            Simulador de Banca
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="text-[#94A3B8] dark:text-[#64748B] text-xs hidden md:block truncate max-w-[200px]">
            {user.email}
          </span>
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#FCA5A5] px-2.5 py-1.5 rounded-md hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
