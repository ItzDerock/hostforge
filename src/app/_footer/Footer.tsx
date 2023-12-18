export default function Footer() {
  return (
    <div className="mt-8 flex flex-row items-center justify-center text-center text-sm">
      <div className="text-muted-foreground">
        💖 100% open source,{" "}
        <a
          href="https://github.com/ItzDerock/hostforge?utm_source=hostforge&utm_medium=footer&utm_campaign=hostforge"
          className="underline"
        >
          view on GitHub
        </a>
        <br />
        Please consider{" "}
        <a href="https://github.com/sponsors/ItzDerock" className="underline">
          sponsoring
        </a>{" "}
        this project if you find it useful.
      </div>
    </div>
  );
}
