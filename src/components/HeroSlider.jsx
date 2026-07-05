import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useLang } from "../i18n/LangContext";

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Gradientes de fallback mientras cargan o si no hay slides
const FALLBACK_BGS = [
  "from-sky-900 via-sky-800 to-blue-900",
  "from-teal-900 via-sky-800 to-blue-900",
  "from-blue-950 via-sky-900 to-teal-900",
];

export default function HeroSlider() {
  const { t } = useLang();
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);

  const BADGES = [
    { icon: <ShieldIcon />, label: t.hero.badge1 },
    { icon: <VideoIcon />,  label: t.hero.badge2 },
    { icon: <UsersIcon />,  label: t.hero.badge3 },
    { icon: <PinIcon />,    label: t.hero.badge4 },
  ];

  useEffect(() => {
    async function fetchSlides() {
      const { data } = await supabase
        .from("hero_slides")
        .select("*")
        .order("position", { ascending: true });
      if (data && data.length > 0) setSlides(data);
    }
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const displaySlides = slides.length > 0
    ? slides
    : [{ id: "fallback", url: null, label: "" }];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {displaySlides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 bg-gradient-to-br ${FALLBACK_BGS[i % FALLBACK_BGS.length]} transition-opacity duration-1000 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.url && (
            <img
              src={slide.url}
              alt={slide.label}
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />

      <div className="relative z-10 text-center px-5 max-w-3xl mx-auto">
        <img
          src="logo.png"
          alt="Logo"
          className="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto mb-6 drop-shadow-lg"
        />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium text-white leading-tight mb-5 drop-shadow-lg">
          {t.hero.title1} <span className="text-sky-300">{t.hero.titleHighlight}</span>
          <br />{t.hero.title2}
        </h1>
        <p className="text-sky-100/80 text-base sm:text-lg mb-8 leading-relaxed drop-shadow">
          {t.hero.sub}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => document.getElementById("precios")?.scrollIntoView({ behavior: "smooth" })}
            className="border border-white/40 hover:border-white text-white px-7 py-3.5 rounded-lg transition-colors text-base w-full sm:w-auto"
          >
            {t.hero.ctaSub2}
          </button>
          <button
            onClick={() => document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth" })}
            className="border border-white/40 hover:border-white text-white px-7 py-3.5 rounded-lg transition-colors text-base w-full sm:w-auto"
          >
            {t.hero.ctaSub}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-6 mt-10 text-sky-200 text-sm">
          {BADGES.map(({ icon, label }) => (
            <span key={label} className="flex items-center justify-center sm:justify-start gap-2">
              {icon} {label}
            </span>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-8 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {slides.length > 0 && (
        <div className="absolute bottom-8 right-4 text-sky-300/60 text-xs z-10 hidden sm:block">
          {slides[current]?.label}
        </div>
      )}

      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-white/30 animate-bounce z-10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}