export default function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {description ? (
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      ) : null}
    </div>
  );
}
