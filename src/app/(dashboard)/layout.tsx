import Footer from "../_footer/Footer";

export default function Layout({
  children,
  navbar,
}: {
  children: React.ReactNode;
  navbar: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <div className="mx-auto max-w-[1500px]">
        {navbar}
        {children}
        <Footer />
      </div>
    </div>
  );
}
