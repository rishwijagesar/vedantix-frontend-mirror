export default function TwoColumnLayout({ sidebar, children }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div>{sidebar}</div>
      <div>{children}</div>
    </div>
  );
}
