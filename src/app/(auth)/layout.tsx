import Footer from "../_footer/Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col content-center justify-center p-4">
      {children}
      <Footer />
    </div>
  );
}
