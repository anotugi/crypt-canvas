import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Private File Viewer',
  description: 'GitHub Private Repository File Viewer',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="bg-gray-900 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
