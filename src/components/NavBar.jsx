import { useState, useEffect } from "react";
import WhatsAppIcon from "./ui/WhatsAppIcon";
import { waLink } from "../utils/links";
import { useLang } from "../i18n/LangContext";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, setLang, t }   = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  const NAV_LINKS = [
    { id: "servicios", label: t.nav.services },
    { id: "precios",   label: t.nav.pricing },
    { id: "galeria",   label: t.nav.gallery },
    { id: "faq",       label: t.nav.faq },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || menuOpen ? "bg-sky-950/95 backdrop-blur shadow-lg" : "bg-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
       <div className="flex items-center gap-2">
  <img
    src="logo.png"
    alt="Go Fly Varadero"
    className="w-8 h-8 object-contain"
  />
  <span className="text-white font-medium text-lg">{t.nav.brand}</span>
</div>

        <div className="hidden md:flex items-center gap-6 text-sm text-sky-200">
          {NAV_LINKS.map(({ id, label }) => (
            <button key={id} onClick={() => scrollToSection(id)} className="hover:text-white transition-colors">
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setLang("es")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                lang === "es" ? "bg-white text-sky-900" : "text-white/70 hover:text-white"
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                lang === "en" ? "bg-white text-sky-900" : "text-white/70 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden text-white p-1"
            aria-label="Menú"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-sky-800/50 px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="text-sky-200 hover:text-white text-sm py-2.5 text-left transition-colors"
            >
              {label}
            </button>
          ))}
          <a 
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors"
          >
            <WhatsAppIcon /> {t.nav.book}
          </a>
        </div>
      )}
    </nav>
  );
}