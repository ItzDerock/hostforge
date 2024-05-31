import { api } from "~/trpc/server";
import Footer from "../_footer/Footer";

export default async function Layout({
  children,
  navbar,
}: {
  children: React.ReactNode;
  navbar: React.ReactNode;
}) {
  // check user auth
  await api.auth.me.query();

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
