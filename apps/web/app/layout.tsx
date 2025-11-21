import "./global.css";

export const metadata = {
  title: "Runesse",
  description: "Runesse web app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-slate-50">
        {children}
      </body>
    </html>
  );
}
