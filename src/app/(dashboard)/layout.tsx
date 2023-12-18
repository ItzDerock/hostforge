import Navbar from "./_navbar/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1500px]">
      <Navbar />
      {children}
    </div>
  );
}
