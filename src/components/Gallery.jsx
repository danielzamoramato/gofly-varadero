import { useState, useEffect } from "react";
import SectionHeader from "./ui/SectionHeader";
import { supabase } from "../utils/supabase";
import { IG_URL } from "../utils/links";
import { useLang } from "../i18n/LangContext";

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronIcon = ({ dir }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

const CATEGORIES = [
  { id: "all",        es: "Todos",                  en: "All" },
  { id: "individual", es: "Vuelos individuales",     en: "Solo flights" },
  { id: "pareja",     es: "Vuelos en pareja",        en: "Couple flights" },
  { id: "instruccion",es: "Vuelos de instrucción",   en: "Training flights" },
  { id: "sorpresas",  es: "Sorpresas",               en: "Surprises" },
];

function LightBox({ items, index, onClose }) {
  const [current, setCurrent] = useState(index);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % items.length);
      if (e.key === "ArrowLeft")  setCurrent((c) => (c - 1 + items.length) % items.length);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [items.length, onClose]);

  function onTouchStart(e) { setTouchStart(e.touches[0].clientX); }
  function onTouchEnd(e) {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setCurrent((c) => (c + 1) % items.length);
      else          setCurrent((c) => (c - 1 + items.length) % items.length);
    }
    setTouchStart(null);
  }

  const item = items[current];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-1">
        <CloseIcon />
      </button>
      <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm z-10">
        {current + 1} / {items.length}
      </p>
      {items.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + items.length) % items.length); }}
          className="absolute left-2 sm:left-4 z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
        >
          <ChevronIcon dir="left" />
        </button>
      )}
      <div
        className="w-full max-w-5xl max-h-[85vh] mx-12 sm:mx-16 flex items-center justify-center px-2"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <video src={item.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg" />
        ) : (
          <img src={item.url} alt={item.label} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        )}
      </div>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs sm:text-sm text-center px-4">
        {item.label}
      </p>
      {items.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % items.length); }}
          className="absolute right-2 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
        >
          <ChevronIcon dir="right" />
        </button>
      )}
    </div>
  );
}

function GalleryGrid({ items, onOpen }) {
  if (items.length === 0) return null;

  const gridCols =
    items.length === 1 ? "grid-cols-1" :
    items.length === 2 ? "grid-cols-2" :
    "grid-cols-2 md:grid-cols-3";

  return (
    <div className={`grid gap-2 ${gridCols} auto-rows-[180px] sm:auto-rows-[240px] md:auto-rows-[280px]`}>
      {items.map((item, i) => (
        <div
          key={item.id}
          onClick={() => onOpen(i)}
          className={`relative rounded-xl overflow-hidden cursor-pointer group ${
            items.length >= 3 && i === 0 ? "row-span-2" : ""
          }`}
        >
          {item.type === "video" ? (
            <video src={item.url} className="w-full h-full object-cover" />
          ) : (
            <img src={item.url} alt={item.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-3">
            <span className="text-white text-xs font-medium drop-shadow">{item.label}</span>
          </div>
          {item.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                <PlayIcon />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Gallery() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightbox, setLightbox]   = useState(null);
  const [lightboxItems, setLightboxItems] = useState([]);
  const { t, lang } = useLang();

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const { data } = await supabase
      .from("gallery_items")
      .select("*")
      .order("position", { ascending: true });
    setItems(data || []);
    setLoading(false);
  }

  function openLightbox(filteredItems, index) {
    setLightboxItems(filteredItems);
    setLightbox(index);
  }

  const filtered = activeCategory === "all"
    ? items
    : items.filter((i) => i.category === activeCategory);

  // Categorías que tienen al menos un item
  const usedCategories = CATEGORIES.filter((c) =>
    c.id === "all" ? true : items.some((i) => i.category === c.id)
  );

  return (
    <section id="galeria" className="py-16 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader tag={t.gallery.tag} title={t.gallery.title} />

        {loading ? (
          <div className="text-center text-neutral-400 py-12 text-sm">{t.gallery.loading}</div>
        ) : items.length === 0 ? (
          <div className="text-center text-neutral-400 py-12 text-sm">{t.gallery.empty}</div>
        ) : (
          <>
            {/* Category filter tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
              {usedCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    activeCategory === c.id
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {lang === "en" ? c.en : c.es}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center text-neutral-400 py-12 text-sm">
                {lang === "en" ? "No photos in this category yet." : "Aún no hay fotos en esta categoría."}
              </div>
            ) : (
              <GalleryGrid
                items={filtered}
                onOpen={(i) => openLightbox(filtered, i)}
              />
            )}
          </>
        )}

        <p className="text-center text-sm text-neutral-500 mt-5 flex items-center justify-center gap-1.5 flex-wrap">
          {t.gallery.ig}{" "}
          <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline flex items-center gap-1">
            <InstagramIcon /> @go_fly_varadero
          </a>{" "}
          {t.gallery.igSub}
        </p>
      </div>

      {lightbox !== null && (
        <LightBox
          items={lightboxItems}
          index={lightbox}
          onClose={() => { setLightbox(null); setLightboxItems([]); }}
        />
      )}
    </section>
  );
}