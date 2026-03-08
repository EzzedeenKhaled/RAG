import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body>
        <nav className="bg-white text-black p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center">
            <span className="material-symbols-outlined text-2xl bg-[#2B8CEE] p-2 rounded-md text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              neurology
            </span>
            <a href="/" className="ml-3 text-lg font-bold">
              Second Brain AI
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
