import { Navbar } from "@/components/navbar";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-charcoal">
      <Navbar />
      {children}
    </div>
  );
}
