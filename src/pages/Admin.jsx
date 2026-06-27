import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "../utils/supabase";

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
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);

  const BUCKET = "gallery go-fly";

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

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (uploadError) { setError("Error subiendo " + file.name); continue; }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      await supabase.from("gallery_items").insert([{
        url:      publicUrl,
        label:    file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        type:     isVideo ? "video" : "photo",
        position: items.length,
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-neutral-900">Galería</h2>
        <label className={`flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? "Subiendo..." : "Subir fotos / videos"}
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">No hay fotos aún. Sube la primera.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.id} className="group relative border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-32 object-cover" />
              ) : (
                <img src={item.url} alt={item.label} className="w-full h-32 object-cover" />
              )}
              <div className="p-2">
                <input
                  defaultValue={item.label}
                  onBlur={(e) => updateLabel(item.id, e.target.value)}
                  className="w-full text-xs text-neutral-700 border border-transparent hover:border-neutral-200 focus:border-teal-400 rounded px-1 py-0.5 focus:outline-none"
                />
                <p className="text-xs text-neutral-400 mt-0.5 capitalize">{item.type}</p>
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

function Dashboard() {
  const [tab, setTab]         = useState("reviews");
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
          {[
            { id: "reviews", label: "Reseñas" },
            { id: "gallery", label: "Galería" },
          ].map((t) => (
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