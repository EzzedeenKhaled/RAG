"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white text-black p-4 border-b border-[#E2E8F0]">
        <div className="flex items-center">
          <button onClick={() => setIsOpen(!isOpen)}>
            <span className="material-symbols-outlined mr-3 mt-2 cursor-pointer">
              menu
            </span>
          </button>

          <span className="material-symbols-outlined text-2xl bg-[#2B8CEE] p-2 rounded-md text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            <Link href="/">neurology</Link>
          </span>

          <Link href="/" className="ml-3 text-lg font-bold">
            Second Brain AI
          </Link>
        </div>
      </nav>

      <div className="flex pt-16.25 min-h-screen">
        <Sidebar isOpen={isOpen} />

        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isOpen ? "ml-64" : "ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </>
  );
}
