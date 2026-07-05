import SectionHeader from "./ui/SectionHeader";
import { SERVICES, SERVICES_EN } from "../data";
import { useLang } from "../i18n/LangContext";

const icons = [
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
  </svg>,
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>,
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>,
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
</svg>,
];

export default function Services() {
  const { lang, t } = useLang();
  const items = lang === "en" ? SERVICES_EN : SERVICES;

  return (
    <section
      id="servicios"
      className="py-16 px-4 sm:px-6 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/services-bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay semitransparente */}
      <div className="absolute inset-0 bg-sky-950/50" />

      <div className="max-w-6xl mx-auto relative z-10">
        <SectionHeader tag={t.services.tag} title={t.services.title} light />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((s, i) => (
            <div
              key={s.title}
              className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-xl p-5 hover:bg-white transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
                {icons[i]}
              </div>
              <h3 className="font-medium text-neutral-900 mb-2">{s.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-4">{s.desc}</p>
              {s.price && (
                <p className="text-xl font-medium text-teal-600">
                  {s.price}{" "}
                  <span className="text-sm font-normal text-neutral-400">{s.priceNote}</span>
                </p>
              )}
              {s.badge && (
                <span className="inline-block mt-2 text-xs font-medium bg-teal-50 text-teal-700 px-3 py-1 rounded-md">
                  {s.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}