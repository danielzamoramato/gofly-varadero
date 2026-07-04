export default function SectionHeader({ tag, title, sub, light }) {
  return (
    <div className="mb-10">
      <p className={`text-xs font-medium uppercase tracking-widest mb-2 ${light ? "text-teal-300" : "text-teal-600"}`}>
        {tag}
      </p>
      <h2 className={`text-3xl font-medium mb-2 ${light ? "text-white" : "text-neutral-900"}`}>
        {title}
      </h2>
      <div className="w-12 h-0.5 bg-teal-500 rounded mb-3" />
      {sub && <p className={`max-w-xl ${light ? "text-white/70" : "text-neutral-500"}`}>{sub}</p>}
    </div>
  );
}