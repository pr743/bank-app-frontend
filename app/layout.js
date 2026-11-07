import "./globals.css";
import Navbar from "./components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#070b14] text-white">


        <Navbar />


        <main className="min-h-screen">
          {children}
        </main>

      </body>
    </html>
  );
}