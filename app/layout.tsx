import type { Metadata } from "next";
import "./globals.css";
import PortalLayout from "@/components/layout/PortalLayout";

export const metadata: Metadata = {
  title: "PCH Hire Portal",
  description: "Accident Management & Fleet Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-[#F3F4F6] text-[#151515]">
        <PortalLayout>{children}</PortalLayout>
      </body>
    </html>
  );
}
