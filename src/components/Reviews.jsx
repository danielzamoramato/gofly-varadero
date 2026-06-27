import { useState, useEffect } from "react";
import SectionHeader from "./ui/SectionHeader";
import Modal from "./ui/Modal";
import { supabase } from "../utils/supabase";
import { useLang } from "../i18n/LangContext";

const StarIcon = ({ filled, onClick }) => (
  <svg
    width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    onClick={onClick}
    className={onClick ? "cursor-pointer" : ""}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const COUNTRIES = [
  "Cuba", "España", "Canadá", "México", "Estados Unidos",
  "Francia", "Alemania", "Italia", "Argentina", "Colombia", "Otro",
];

const EMPTY_FORM = { name: "", country: "Cuba", rating: 5, text: "" };

function ReviewForm({ onClose }) {
  const { t } = useLang();
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error } = await supabase.from("reviews").insert([{
      name:    form.name.trim(),
      country: form.country,
      rating:  form.rating,
      text:    form.text.trim(),
      status:  "pending",
    }]);

    if (error) {
      setError(t.reviews.error);
    } else {
      setSubmitted(true);
      setForm(EMPTY_FORM);
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-medium text-neutral-900 mb-1">{t.reviews.successTitle}</p>
        <p className="text-sm text-neutral-500 mb-6">{t.reviews.successSub}</p>
        <button onClick={onClose} className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
          {t.reviews.close}
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-medium text-neutral-900">{t.reviews.formTitle}</h3>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-neutral-500 mb-5">{t.reviews.formSub}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">{t.reviews.rating}</label>
          <div className="flex gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} filled={i < form.rating} onClick={() => setForm((f) => ({ ...f, rating: i + 1 }))} />
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">{t.reviews.name}</label>
          <input
            type="text" required maxLength={60} value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t.reviews.namePlaceholder}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">{t.reviews.country}</label>
          <select
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">{t.reviews.experience}</label>
          <textarea
            required minLength={20} maxLength={500} rows={4} value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            placeholder={t.reviews.experiencePlaceholder}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
          <p className="text-xs text-neutral-400 mt-1 text-right">{form.text.length}/500</p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit" disabled={submitting}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg text-sm transition-colors"
        >
          {submitting ? t.reviews.submitting : t.reviews.submit}
        </button>
      </form>
    </div>
  );
}

export default function Reviews() {
  const { t } = useLang();
  const [reviews, setReviews]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchReviews(); }, []);

  async function fetchReviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews").select("*").eq("status", "approved").order("created_at", { ascending: false });
    if (!error) setReviews(data);
    setLoading(false);
  }

  return (
    <section className="py-16 px-4 sm:px-6 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
          <SectionHeader tag={t.reviews.tag} title={t.reviews.title} />
          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 flex items-center gap-2 border border-teal-500 text-teal-600 hover:bg-teal-50 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t.reviews.add}
          </button>
        </div>

        {loading ? (
          <div className="text-center text-neutral-400 py-12 text-sm">{t.reviews.loading}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center text-neutral-400 py-12 text-sm">{t.reviews.empty}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-neutral-200 rounded-xl p-5">
                <div className="flex gap-0.5 text-amber-400 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} filled={i < r.rating} />)}
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed italic mb-4">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-medium shrink-0">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{r.name}</p>
                    <p className="text-xs text-neutral-400">{r.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ReviewForm onClose={() => setModalOpen(false)} />
      </Modal>
    </section>
  );
}