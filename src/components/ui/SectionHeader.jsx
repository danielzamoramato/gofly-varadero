export default function SectionHeader({ tag, title, sub }) {
  return (
    <div className="mb-10">
      <p className="text-xs font-medium text-teal-600 uppercase tracking-widest mb-2">{tag}</p>
      <h2 className="text-3xl font-medium text-neutral-900 mb-2">{title}</h2>
      <div className="w-12 h-0.5 bg-teal-500 rounded mb-3" />
      {sub && <p className="text-neutral-500 max-w-xl">{sub}</p>}
    </div>
  );
}