import { useState, useEffect } from "react";
import WhatsAppIcon from "./ui/WhatsAppIcon";
import { waLink } from "../utils/links";
import { HERO_SLIDES } from "../data";

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
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const BADGES = [
  { icon: <ShieldIcon />, label: "Vuelos seguros" },
  { icon: <VideoIcon />,  label: "Video incluido" },
  { icon: <UsersIcon />,  label: "Vuelo biplaza" },
  { icon: <PinIcon />,    label: "Varadero, Cuba" },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % HERO_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-opacity duration-1000 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
        {slide.src && (
      <img
        src={slide.src}
        alt={slide.label}
        className="w-full h-full object-cover absolute inset-0"
      />
    )}
  </div>
))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />

      <div className="relative z-10 text-center px-5 max-w-3xl mx-auto">
        <p className="text-sky-300 text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">
          Varadero, Cuba
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium text-white leading-tight mb-5 drop-shadow-lg">
          Vuela sobre el <span className="text-sky-300">Caribe</span>
          <br />en paramotor
        </h1>
        <p className="text-sky-100/80 text-base sm:text-lg mb-8 leading-relaxed drop-shadow">
          Una experiencia única sobrevolando las playas más hermosas de Cuba.
          Vuelos biplaza, seguros y memorables.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a 
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-7 py-3.5 rounded-lg transition-colors text-base w-full sm:w-auto"
          >
            <WhatsAppIcon /> Reservar por WhatsApp
          </a>
          <button
            onClick={() => document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth" })}
            className="border border-white/40 hover:border-white text-white px-7 py-3.5 rounded-lg transition-colors text-base w-full sm:w-auto"
          >
            Ver servicios
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

      <div className="absolute bottom-8 flex gap-2 z-10">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-white" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>

      <div className="absolute bottom-8 right-4 text-sky-300/60 text-xs z-10 hidden sm:block">
        {HERO_SLIDES[current].label}
      </div>

      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-white/30 animate-bounce z-10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}