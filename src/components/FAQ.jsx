import { useState } from "react";
import SectionHeader from "./ui/SectionHeader";
import { FAQS } from "../data";

const ChevronIcon = ({ open }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="py-16 px-4 sm:px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <SectionHeader tag="Preguntas frecuentes" title="Todo lo que necesitas saber" />
        <div className="space-y-2">
          {FAQS.map((item, i) => (
            <div key={i} className="border border-neutral-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left text-sm font-medium text-neutral-900 bg-white hover:bg-neutral-50 transition-colors"
              >
                {item.q}
                <ChevronIcon open={open === i} />
              </button>
              {open === i && (
                <div className="px-4 sm:px-5 pb-4 text-sm text-neutral-600 leading-relaxed bg-white">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}