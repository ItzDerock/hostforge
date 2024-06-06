export default function HomeLayout({
  stats,
  children,
}: {
  stats: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      {stats}
      {children}
    </>
  );
}
