import Footer from "../_footer/Footer";
import Navbar from "./_navbar/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4">
      <div className="mx-auto max-w-[1500px]">
        <Navbar />
        {children}
        <Footer />
      </div>
    </div>
  );
}
