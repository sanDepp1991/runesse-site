import "./global.css";

export const metadata = {
  title: "Runesse Admin",
  description: "Runesse Admin Console",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-slate-50">{children}</body>
    </html>
  );
}
