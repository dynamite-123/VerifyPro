import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Auth.jpg"
          alt="Background"
          fill
          priority
          className="object-cover"
          quality={100}
        />
        {/* Overlay to ensure text is readable */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto">
        {children}
      </div>
    </div>
  );
}
