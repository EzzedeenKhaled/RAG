"use client"; // Required for localStorage and state

import { useEffect, useState } from "react";

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenWelcomePopup");
    if (!hasSeenPopup) {
      setIsOpen(true);
      localStorage.setItem("hasSeenWelcomePopup", "true");
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-md rounded-2xl p-8 shadow-2xl bg-white">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-blue-500 text-3xl">
            neurology
          </span>
          <h2 className="text-xl font-bold">Welcome to AI Search</h2>
        </div>

        <p className="dark:text-zinc-700 leading-relaxed">
          Upload your PDFs and chat with them instantly. Our AI "Second Brain"
          helps you find answers in seconds. No more endless scrolling!
        </p>

        <button
          onClick={() => setIsOpen(false)}
          className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Let's Get Started
        </button>
      </div>
    </div>
  );
}
