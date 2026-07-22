import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "../utils/supabase";
import AvailabilityManager from "../components/AvailabilityManager";
import bcrypt from "bcryptjs";

const StarIcon = ({ filled }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function Login({ onLogin }) {
  const [pw, setPw]         = useState("");
  const [error, setError]   = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setChecking(true);
    setError(false);

    const { data, error: fetchError } = await supabase
      .from("admin_settings")
      .select("password_hash")
      .eq("id", 1)
      .single();

    // Si no existe ninguna fila aún, sembramos la contraseña por defecto
    if (fetchError || !data) {
      const defaultHash = bcrypt.hashSync("gofly2026", 10);
      await supabase.from("admin_settings").insert([{ id: 1, password_hash: defaultHash }]);
      const ok = pw === "gofly2026";
      setChecking(false);
      if (ok) {
        sessionStorage.setItem("gofly_admin", "1");
        onLogin();
      } else {
        setError(true);
        setPw("");
      }
      return;
    }

    const match = bcrypt.compareSync(pw, data.password_hash);
    setChecking(false);

    if (match) {
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
            disabled={checking}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {checking ? "Verificando..." : "Entrar"}
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
          { id: "hero", label: "Imágenes del Hero" },
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("individual");

  const BUCKET = "gallery go-fly";

  const CATS = [
    { id: "individual", label: "Vuelos Tandem" },
    { id: "pareja", label: "Vuelos en pareja" },
    { id: "instruccion", label: "Vuelos de instrucción" },
    { id: "sorpresas", label: "Sorpresas" },
  ];

  useEffect(() => {
    fetchItems();
  }, []);

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
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const isVideo = file.type.startsWith("video/");

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);
      if (uploadError) {
        setError("Error subiendo " + file.name);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      await supabase.from("gallery_items").insert([
        {
          url: publicUrl,
          label: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          type: isVideo ? "video" : "photo",
          position: items.length,
          category: uploadCategory,
        },
      ]);
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
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, category } : i)));
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
            {CATS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <label
            className={`flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">
          No hay fotos aún.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50"
            >
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-32 object-cover" />
              ) : (
                <img
                  src={item.url}
                  alt={item.label}
                  className="w-full h-32 object-cover"
                />
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
                  {CATS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleDelete(item)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-red-50 border border-neutral-200 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
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
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const BUCKET = "gallery go-fly";

  useEffect(() => {
    fetchSlides();
  }, []);

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
      const ext = file.name.split(".").pop();
      const path = `hero-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);
      if (uploadError) {
        setError("Error subiendo " + file.name);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      await supabase.from("hero_slides").insert([
        {
          url: publicUrl,
          label: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          position: slides.length,
        },
      ]);
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
        <label
          className={`flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? "Subiendo..." : "Subir imágenes"}
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>
      <p className="text-xs text-neutral-400 mb-4">
        Se mostrarán en rotación en la pantalla principal. Recomendado: fotos
        horizontales de alta resolución.
      </p>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Cargando...</p>
      ) : slides.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">
          No hay imágenes del hero aún. Sube la primera.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className="group relative border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50"
            >
              <div className="relative">
                <img
                  src={slide.url}
                  alt={slide.label}
                  className="w-full h-40 object-cover"
                />
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
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-red-50 border border-neutral-200 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditBookingModal({ booking, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: booking.full_name,
    document_id: booking.document_id,
    tel: booking.tel || "",
    date: booking.date,
    time: booking.time.slice(0, 5),
    people: booking.people || 1,
    pickup: booking.pickup,
    pickup_location: booking.pickup_location || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("bookings")
      .update({
        full_name: form.full_name.trim(),
        document_id: form.document_id.trim(),
        tel: form.tel.trim(),
        date: form.date,
        time: form.time,
        people: form.people,
        pickup: form.pickup,
        pickup_location: form.pickup ? form.pickup_location.trim() : null,
      })
      .eq("id", booking.id);

    setSaving(false);

    if (error) {
      setError("No se pudo guardar. Intenta de nuevo.");
      return;
    }

    onSaved({
      ...booking,
      full_name: form.full_name.trim(),
      document_id: form.document_id.trim(),
      tel: form.tel.trim(),
      date: form.date,
      time: form.time,
      people: form.people,
      pickup: form.pickup,
      pickup_location: form.pickup ? form.pickup_location.trim() : null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h3 className="text-lg font-medium text-neutral-900">
            Editar reserva
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1">
              CI / ID
            </label>
            <input
              type="text"
              required
              value={form.document_id}
              onChange={(e) => set("document_id", e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={form.tel}
              onChange={(e) => set("tel", e.target.value)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">
                Hora
              </label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1">
              Personas
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.people}
              onChange={(e) => set("people", parseInt(e.target.value) || 1)}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div
            onClick={() => set("pickup", !form.pickup)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              form.pickup
                ? "border-teal-500 bg-teal-50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                form.pickup
                  ? "bg-teal-600 border-teal-600"
                  : "border-neutral-300"
              }`}
            >
              {form.pickup && (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-sm text-neutral-700">Necesita recogida</span>
          </div>

          {form.pickup && (
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">
                Lugar de recogida
              </label>
              <input
                type="text"
                value={form.pickup_location}
                onChange={(e) => set("pickup_location", e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming"); // upcoming | past | all
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | confirmed | cancelled
  const [working, setWorking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [filter, statusFilter]);

  async function fetchBookings() {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("bookings")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (filter === "upcoming") query = query.gte("date", today);
    if (filter === "past") query = query.lt("date", today);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const { data } = await query;
    setBookings(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta reserva?")) return;
    await supabase.from("bookings").delete().eq("id", id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  async function updateBookingStatus(id, status) {
    setWorking(id);
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b)),
    );
    setWorking(null);
  }

  function formatDate(d) {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(t) {
    return t.slice(0, 5);
  }

  function statusBadge(status) {
    const map = {
      confirmed: { label: "Confirmada", cls: "bg-teal-50 text-teal-700" },
      cancelled: { label: "Cancelada", cls: "bg-red-50 text-red-500" },
      pending: { label: "Pendiente", cls: "bg-amber-50 text-amber-600" },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
        {s.label}
      </span>
    );
  }

  // Agrupar por fecha (solo se cuentan confirmadas + pendientes para "día lleno")
  const grouped = bookings.reduce((acc, b) => {
    if (!acc[b.date]) acc[b.date] = [];
    acc[b.date].push(b);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-medium text-neutral-900">Reservas</h2>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "upcoming", label: "Próximas" },
            { id: "past", label: "Pasadas" },
            { id: "all", label: "Todas" },
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

      {/* Filtro por estado */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: "all", label: "Todos los estados" },
          { id: "pending", label: "Pendientes" },
          { id: "confirmed", label: "Confirmadas" },
          { id: "cancelled", label: "Canceladas" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s.id
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Cargando...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">
          No hay reservas.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => {
            // Agrupar por hora dentro del día para detectar horarios llenos
            const byTime = items.reduce((acc, b) => {
              if (b.status === "cancelled") return acc;
              if (!acc[b.time]) acc[b.time] = 0;
              acc[b.time]++;
              return acc;
            }, {});
            const fullSlots = Object.entries(byTime)
              .filter(([, count]) => count >= 2)
              .map(([time]) => time);

            return (
              <div key={date}>
                {/* Fecha header */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <p className="text-sm font-medium text-neutral-900">
                    {formatDate(date)}
                  </p>
                  <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                    {items.length} reserva{items.length !== 1 ? "s" : ""}
                  </span>
                  {fullSlots.map((time) => (
                    <span
                      key={time}
                      className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-1"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {formatTime(time)} lleno
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  {items.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white border border-neutral-200 rounded-xl p-4"
                    >
                      {/* Nombre + badges + botones */}
                      <div className="flex flex-col gap-3 mb-3">
                        <div className="flex gap-2 flex-wrap shrink-0">
                          {b.status === "pending" && (
                            <>
                              <button
                                onClick={() => setEditingBooking(b)}
                                className="flex items-center gap-1.5 bg-white hover:bg-sky-50 text-sky-600 border border-sky-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Editar
                              </button>
                              <button
                                onClick={() =>
                                  updateBookingStatus(b.id, "confirmed")
                                }
                                disabled={working === b.id}
                                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Confirmar
                              </button>
                              <button
                                onClick={() =>
                                  updateBookingStatus(b.id, "cancelled")
                                }
                                disabled={working === b.id}
                                className="flex items-center gap-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-500 border border-red-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Cancelar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="flex items-center gap-1.5 bg-white hover:bg-neutral-50 text-neutral-400 border border-neutral-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-neutral-900">
                            {b.full_name}
                          </span>
                          <span className="text-xs text-neutral-400 hidden sm:inline">
                            ·
                          </span>
                          <span className="text-xs text-neutral-500">
                            {b.document_id}
                          </span>
                          <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                            {b.plan_name}
                          </span>
                          {statusBadge(b.status)}
                        </div>
                      </div>

                      {/* Detalles en grid organizado */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs text-neutral-500 pt-3 border-t border-neutral-100">
                        <span className="flex items-center gap-1.5">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {formatTime(b.time)}
                        </span>

                        {b.subtotal > 0 && (
                          <span className="flex items-center gap-1.5 font-medium text-teal-700">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0"
                            >
                              <line x1="12" y1="1" x2="12" y2="23" />
                              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            ${b.subtotal} USD
                          </span>
                        )}

                        {b.tel && (
                          <span className="flex items-center gap-1.5">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.5z" />
                            </svg>
                            {b.tel}
                          </span>
                        )}

                        {b.people && (
                          <span className="flex items-center gap-1.5">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0"
                            >
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            {b.people} persona{b.people !== 1 ? "s" : ""}
                          </span>
                        )}

                        {b.pickup && (
                          <span className="flex items-center gap-1.5 text-sky-600 col-span-2 sm:col-span-1">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {b.pickup_location}
                          </span>
                        )}

                        <span className="text-neutral-300">
                          {new Date(b.created_at).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSaved={(updated) => {
            setBookings((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b)),
            );
            setEditingBooking(null);
          }}
        />
      )}
    </div>
  );
}

function ChangePasswordSection() {
  const [unlocked, setUnlocked]     = useState(false);
  const [superPw, setSuperPw]       = useState("");
  const [superError, setSuperError] = useState(false);
  const [checkingSuper, setCheckingSuper] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(false);

  async function handleUnlock(e) {
    e.preventDefault();
    setCheckingSuper(true);
    setSuperError(false);

    const { data, error: fetchError } = await supabase
      .from("admin_settings")
      .select("super_password_hash")
      .eq("id", 1)
      .single();

    // Si no existe contraseña maestra aún, la sembramos con un valor por defecto
    if (fetchError || !data || !data.super_password_hash) {
      const defaultSuperHash = bcrypt.hashSync("gofly-master-2026", 10);
      await supabase.from("admin_settings").update({ super_password_hash: defaultSuperHash }).eq("id", 1);
      const ok = superPw === "gofly-master-2026";
      setCheckingSuper(false);
      if (ok) { setUnlocked(true); } else { setSuperError(true); setSuperPw(""); }
      return;
    }

    const match = bcrypt.compareSync(superPw, data.super_password_hash);
    setCheckingSuper(false);

    if (match) {
      setUnlocked(true);
    } else {
      setSuperError(true);
      setSuperPw("");
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPw.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setSaving(true);

    const { data, error: fetchError } = await supabase
      .from("admin_settings")
      .select("password_hash")
      .eq("id", 1)
      .single();

    if (fetchError || !data) {
      setError("No se pudo verificar la contraseña actual.");
      setSaving(false);
      return;
    }

    const match = bcrypt.compareSync(currentPw, data.password_hash);
    if (!match) {
      setError("La contraseña actual del panel es incorrecta.");
      setSaving(false);
      return;
    }

    const newHash = bcrypt.hashSync(newPw, 10);
    const { error: updateError } = await supabase
      .from("admin_settings")
      .update({ password_hash: newHash })
      .eq("id", 1);

    setSaving(false);

    if (updateError) {
      setError("No se pudo guardar la nueva contraseña.");
      return;
    }

    setSuccess(true);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  }

  if (!unlocked) {
    return (
      <div className="max-w-md">
        <h2 className="font-medium text-neutral-900 mb-1">Ajustes protegidos</h2>
        <p className="text-sm text-neutral-500 mb-6">
          Esta sección requiere la contraseña maestra.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4 bg-white border border-neutral-200 rounded-xl p-5">
          <div>
            <label className="text-sm font-medium text-neutral-700 block mb-1">Contraseña maestra</label>
            <input
              type="password" required
              value={superPw}
              onChange={(e) => { setSuperPw(e.target.value); setSuperError(false); }}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {superError && <p className="text-xs text-red-500 mt-1">Contraseña maestra incorrecta.</p>}
          </div>
          <button
            type="submit"
            disabled={checkingSuper}
            className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {checkingSuper ? "Verificando..." : "Desbloquear"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <h2 className="font-medium text-neutral-900 mb-1">Cambiar contraseña del panel</h2>
      <p className="text-sm text-neutral-500 mb-6">
        Esta es la contraseña que usan las 5 personas para entrar al panel.
      </p>

      <form onSubmit={handleChangePassword} className="space-y-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">Contraseña actual del panel</label>
          <input
            type="password" required
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">Nueva contraseña</label>
          <input
            type="password" required minLength={6}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">Confirmar nueva contraseña</label>
          <input
            type="password" required minLength={6}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-teal-600">Contraseña actualizada correctamente.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {saving ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}

function Dashboard() {
  const [tab, setTab] = useState("bookings");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
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
    { id: "reviews", label: "Reseñas" },
    { id: "gallery", label: "Galería" },
    { id: "settings", label: "Ajustes" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-medium text-neutral-900">
            Panel de administración
          </h1>
          <p className="text-xs text-neutral-400">Go Fly Varadero</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors flex items-center gap-1.5"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Salir
        </button>
      </div>

      <div className="bg-white border-b border-neutral-200 px-6">
        <div className="flex gap-0 flex-nowrap overflow-x-auto">
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
        ) : tab === "settings" ? (
          <ChangePasswordSection />
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
              <p className="text-sm text-neutral-400 py-12 text-center">
                Cargando...
              </p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-neutral-400 py-12 text-center">
                No hay reseñas{" "}
                {filter === "pending" ? "pendientes" : "aprobadas"}.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white border border-neutral-200 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-medium shrink-0">
                            {r.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {r.name}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {r.country} ·{" "}
                              {new Date(r.created_at).toLocaleDateString(
                                "es-ES",
                              )}
                            </p>
                          </div>
                          <div className="flex gap-0.5 text-amber-400 ml-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon key={i} filled={i < r.rating} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          "{r.text}"
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {filter === "pending" && (
                          <button
                            onClick={() => updateStatus(r.id, "approved")}
                            disabled={working === r.id}
                            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
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
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
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
