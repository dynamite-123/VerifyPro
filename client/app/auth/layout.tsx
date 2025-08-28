export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-stone-50 to-gray-50 min-h-screen">
      <div className="container mx-auto">
        {children}
      </div>
    </div>
  );
}
