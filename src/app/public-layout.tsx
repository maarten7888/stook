import { Navbar } from "@/components/navbar";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-charcoal relative">
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      {children}
    </div>
  );
}
