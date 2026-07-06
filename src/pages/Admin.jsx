import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "../utils/supabase";
import AvailabilityManager from "../components/AvailabilityManager";

const ADMIN_PASSWORD = "gofly2026";

const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function Login({ onLogin }) {
  const [pw, setPw]       = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("gofly_admin", "1");
      onLogin();
    } else {
      setError(true);
      setPw("");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="bg-white border border-neutral-200 rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-medium text-neutral-900 mb-1">Panel de administración</h1>
        <p className="text-sm text-neutral-500 mb-6">Go Fly Varadero</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1">Contraseña</label>
            <input
              type="password" required
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false); }}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {error && <p className="text-xs text-red-500 mt-1">Contraseña incorrecta</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

function GalleryManager() {
  const [section, setSection] = useState("gallery"); // "gallery" | "hero"

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "gallery", label: "Galería pública" },
          { id: "hero",    label: "Imágenes del Hero" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              section === s.id
                ? "bg-teal-600 text-white"
                : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "gallery" ? <GalleryGrid /> : <HeroGrid />}
    </div>
  );
}

function GalleryGrid() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);
  const [uploadCategory, setUploadCategory] = useState("individual");

  const BUCKET = "gallery go-fly";

  const CATS = [
    { id: "individual",  label: "Vuelos individuales" },
    { id: "pareja",      label: "Vuelos en pareja" },
    { id: "instruccion", label: "Vuelos de instrucción" },
    { id: "sorpresas",   label: "Sorpresas" },
  ];

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const { data } = await supabase
      .from("gallery_items")
      .select("*")
      .order("position", { ascending: true });
    setItems(data || []);
    setLoading(false);
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setError(null);

    for (const file of files) {
      const ext  = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const isVideo = file.type.startsWith("video/");

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) { setError("Error subiendo " + file.name); continue; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      await supabase.from("gallery_items").insert([{
        url:      publicUrl,
        label:    file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        type:     isVideo ? "video" : "photo",
        position: items.length,
        category: uploadCategory,
      }]);
    }

    await fetchItems();
    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(item) {
    if (!confirm(`¿Eliminar "${item.label}"?`)) return;
    const path = item.url.split(`/${BUCKET}/`)[1];
    await supabase.storage.from(BUCKET).remove([path]);
    await supabase.from("gallery_items").delete().eq("id", item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function updateLabel(id, label) {
    await supabase.from("gallery_items").update({ label }).eq("id", id);
  }

  async function updateCategory(id, category) {
    await supabase.from("gallery_items").update({ category }).eq("id", id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, category } : i));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-medium text-neutral-900">Galería pública</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de categoría antes de subir */}
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>

          <label className={`flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? "Subiendo..." : "Subir fotos / videos"}
            <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No hay fotos aún.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.id} className="group relative border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-32 object-cover" />
              ) : (
                <img src={item.url} alt={item.label} className="w-full h-32 object-cover" />
              )}
              <div className="p-2 space-y-1">
                <input
                  defaultValue={item.label}
                  onBlur={(e) => updateLabel(item.id, e.target.value)}
                  className="w-full text-xs text-neutral-700 border border-transparent hover:border-neutral-200 focus:border-teal-400 rounded px-1 py-0.5 focus:outline-none"
                />
                <select
                  value={item.category || "individual"}
                  onChange={(e) => updateCategory(item.id, e.target.value)}
                  className="w-full text-xs text-neutral-500 border border-transparent hover:border-neutral-200 focus:border-teal-400 rounded px-1 py-0.5 focus:outline-none bg-transparent"
                >
                  {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <button
                onClick={() => handleDelete(item)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-red-50 border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HeroGrid() {
  const [slides, setSlides]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);

  const BUCKET = "gallery go-fly";

  useEffect(() => { fetchSlides(); }, []);

  async function fetchSlides() {
    const { data } = await supabase
      .from("hero_slides")
      .select("*")
      .order("position", { ascending: true });
    setSlides(data || []);
    setLoading(false);
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setError(null);

    for (const file of files) {
      const ext  = file.name.split(".").pop();
      const path = `hero-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) { setError("Error subiendo " + file.name); continue; }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      await supabase.from("hero_slides").insert([{
        url:      publicUrl,
        label:    file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        position: slides.length,
      }]);
    }

    await fetchSlides();
    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(slide) {
    if (!confirm(`¿Eliminar esta imagen del hero?`)) return;
    const path = slide.url.split(`/${BUCKET}/`)[1];
    await supabase.storage.from(BUCKET).remove([path]);
    await supabase.from("hero_slides").delete().eq("id", slide.id);
    setSlides((prev) => prev.filter((s) => s.id !== slide.id));
  }

  async function updateLabel(id, label) {
    await supabase.from("hero_slides").update({ label }).eq("id", id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium text-neutral-900">Imágenes del Hero</h2>
        <label className={`flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? "Subiendo..." : "Subir imágenes"}
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>
      <p className="text-xs text-neutral-400 mb-4">Se mostrarán en rotación en la pantalla principal. Recomendado: fotos horizontales de alta resolución.</p>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Cargando...</p>
      ) : slides.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No hay imágenes del hero aún. Sube la primera.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {slides.map((slide, i) => (
            <div key={slide.id} className="group relative border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
              <div className="relative">
                <img src={slide.url} alt={slide.label} className="w-full h-40 object-cover" />
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                  #{i + 1}
                </div>
              </div>
              <div className="p-2">
                <input
                  defaultValue={slide.label}
                  onBlur={(e) => updateLabel(slide.id, e.target.value)}
                  className="w-full text-xs text-neutral-700 border border-transparent hover:border-neutral-200 focus:border-teal-400 rounded px-1 py-0.5 focus:outline-none"
                  placeholder="Etiqueta (opcional)"
                />
              </div>
              <button
                onClick={() => handleDelete(slide)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-red-50 border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("upcoming"); // upcoming | past | all

  useEffect(() => { fetchBookings(); }, [filter]);

  async function fetchBookings() {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("bookings")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (filter === "upcoming") query = query.gte("date", today);
    if (filter === "past")     query = query.lt("date", today);

    const { data } = await query;
    setBookings(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta reserva?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  function formatDate(d) {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  }

  function formatTime(t) {
    return t.slice(0, 5);
  }

  // Agrupar por fecha
  const grouped = bookings.reduce((acc, b) => {
    if (!acc[b.date]) acc[b.date] = [];
    acc[b.date].push(b);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-medium text-neutral-900">Reservas</h2>
        <div className="flex gap-2">
          {[
            { id: "upcoming", label: "Próximas" },
            { id: "past",     label: "Pasadas" },
            { id: "all",      label: "Todas" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.id
                  ? "bg-teal-600 text-white"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Cargando...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No hay reservas {filter === "upcoming" ? "próximas" : filter === "past" ? "pasadas" : ""}.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              {/* Fecha header */}
              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm font-medium text-neutral-900">{formatDate(date)}</p>
                <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                  {items.length} reserva{items.length !== 1 ? "s" : ""}
                </span>
                {items.length >= 2 && (
                  <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Día lleno
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {items.map((b) => (
                  <div key={b.id} className="bg-white border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-medium text-neutral-900">{b.full_name}</span>
                          <span className="text-xs text-neutral-400">·</span>
                          <span className="text-xs text-neutral-500">{b.document_id}</span>
                          <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                            {b.plan_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            {formatTime(b.time)}
                          </span>
                          {b.pickup && (
                            <span className="flex items-center gap-1 text-sky-600">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              Recogida: {b.pickup_location}
                            </span>
                          )}
                          <span className="text-neutral-300">
                            {new Date(b.created_at).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-red-500 border border-red-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [tab, setTab]         = useState("bookings");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("pending");
  const [working, setWorking] = useState(null);

  useEffect(() => {
    if (tab === "reviews") fetchReviews();
  }, [filter, tab]);

  async function fetchReviews() {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    setWorking(id);
    await supabase.from("reviews").update({ status }).eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setWorking(null);
  }

  function logout() {
    sessionStorage.removeItem("gofly_admin");
    window.location.reload();
  }

  const TABS = [
    { id: "bookings", label: "Reservas" },
    { id: "availability", label: "Disponibilidad" },
    { id: "reviews",  label: "Reseñas" },
    { id: "gallery",  label: "Galería" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-medium text-neutral-900">Panel de administración</h1>
          <p className="text-xs text-neutral-400">Go Fly Varadero</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors flex items-center gap-1.5"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Salir
        </button>
      </div>

      <div className="bg-white border-b border-neutral-200 px-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {tab === "gallery" ? (
          <GalleryManager />
        ) : tab === "bookings" ? (
          <BookingsManager />
          ) : tab === "availability" ? (
          <AvailabilityManager />
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              {["pending", "approved"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === s
                      ? "bg-teal-600 text-white"
                      : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  {s === "pending" ? "Pendientes" : "Aprobadas"}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-sm text-neutral-400 py-12 text-center">Cargando...</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-neutral-400 py-12 text-center">
                No hay reseñas {filter === "pending" ? "pendientes" : "aprobadas"}.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white border border-neutral-200 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-medium shrink-0">
                            {r.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{r.name}</p>
                            <p className="text-xs text-neutral-400">{r.country} · {new Date(r.created_at).toLocaleDateString("es-ES")}</p>
                          </div>
                          <div className="flex gap-0.5 text-amber-400 ml-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon key={i} filled={i < r.rating} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">"{r.text}"</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {filter === "pending" && (
                          <button
                            onClick={() => updateStatus(r.id, "approved")}
                            disabled={working === r.id}
                            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Aprobar
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(r.id, "rejected")}
                          disabled={working === r.id}
                          className="flex items-center gap-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-500 border border-red-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const [auth, setAuth] = useState(!!sessionStorage.getItem("gofly_admin"));
  if (!auth) return <Login onLogin={() => setAuth(true)} />;
  return <Dashboard />;
}