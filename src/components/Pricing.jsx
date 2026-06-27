import SectionHeader from "./ui/SectionHeader";
import WhatsAppIcon from "./ui/WhatsAppIcon";
import { PLANS, PLANS_EN } from "../data";
import { waLink } from "../utils/links";
import { useLang } from "../i18n/LangContext";

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function Pricing() {
  const { t, lang } = useLang();
  const plans = lang === "en" ? PLANS_EN : PLANS;

  return (
    <section id="precios" className="py-16 px-4 sm:px-6 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <SectionHeader tag={t.pricing.tag} title={t.pricing.title} sub={t.pricing.sub} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl p-5 flex flex-col bg-white ${
                p.featured ? "border-2 border-teal-500 shadow-sm" : "border border-neutral-200"
              }`}
            >
              {p.badge && (
                <span className="inline-block self-start text-xs font-medium bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md mb-3">
                  {p.badge}
                </span>
              )}
              <h3 className="font-medium text-neutral-900 mb-1">{p.name}</h3>
              <p className="text-3xl font-medium text-teal-600 mt-2 mb-0.5">{p.price}</p>
              <p className="text-xs text-neutral-500 mb-2">{p.unit}</p>
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400 mb-4">
                <ClockIcon /> {p.duration}
              </span>
              <ul className="flex-1 space-y-2 mb-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-neutral-600 border-t border-neutral-100 pt-2 first:border-0 first:pt-0">
                    <span className="text-teal-500 shrink-0"><CheckIcon /></span> {f}
                  </li>
                ))}
              </ul>
              <a 
                href={waLink(p.waMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full text-center py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  p.featured
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : "border border-teal-500 text-teal-600 hover:bg-teal-50"
                }`}
              >
                <WhatsAppIcon size={13} /> {t.pricing.book}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}