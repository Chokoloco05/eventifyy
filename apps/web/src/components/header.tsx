"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const links = [
  { to: "/" as Route, label: "Explorer" },
  { to: "/community" as Route, label: "Communauté" },
  { to: "/dashboard" as Route, label: "Dashboard" },
] as const;

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/72 dark:border-slate-800 dark:bg-slate-950/86">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link className="group flex items-center gap-3" href="/">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white shadow-sm transition-transform group-hover:-rotate-3 group-hover:scale-105 dark:bg-white dark:text-slate-950">
            E
          </span>
          <span className="leading-tight">
            <span className="block text-base font-black tracking-normal text-slate-950 dark:text-white">Eventifyy</span>
            <span className="hidden text-xs font-semibold text-slate-500 sm:block">Bruxelles events</span>
          </span>
        </Link>

        <nav className="hidden rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-bold text-slate-600 shadow-sm sm:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {links.map(({ to, label }) => {
            const isActive = pathname === to;
            return (
              <Link
                className={`rounded-full px-4 py-2 transition-all duration-200 ${
                  isActive
                    ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                    : "hover:bg-white hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
                href={to}
                key={to}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1 sm:hidden dark:border-slate-800 dark:bg-slate-900">
            {links.map(({ to, label }) => (
              <Link
                aria-label={label}
                className={`rounded-full px-3 py-2 text-xs font-bold transition-all ${
                  pathname === to
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "text-slate-600 dark:text-slate-300"
                }`}
                href={to}
                key={to}
              >
                {label}
              </Link>
            ))}
          </div>
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
