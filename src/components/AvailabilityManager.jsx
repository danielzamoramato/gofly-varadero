import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabaseAdmin as supabase } from "../utils/supabase";

export default function AvailabilityManager() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState([]);
  const [reason, setReason]             = useState("");
  const [loading, setLoading]           = useState(true);

  useEffect(() => { loadBlockedDates(); }, []);

  async function loadBlockedDates() {
    const { data } = await supabase
      .from("blocked_dates")
      .select("*")
      .order("date");
    setBlockedDates(data || []);
    setLoading(false);
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const currentDate = formatDate(selectedDate);
  const blocked = blockedDates.find((d) => d.date === currentDate);

  async function toggleBlocked() {
    if (blocked) {
      await supabase.from("blocked_dates").delete().eq("id", blocked.id);
    } else {
      await supabase.from("blocked_dates").insert([{ date: currentDate, reason }]);
    }
    setReason("");
    loadBlockedDates();
  }

  if (loading) return <p className="text-center py-12 text-sm text-neutral-400">Cargando...</p>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-neutral-900">Disponibilidad</h2>
        <p className="text-sm text-neutral-500">Haz clic sobre un día para bloquearlo o desbloquearlo.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Calendario */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shrink-0">
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            tileClassName={({ date }) => {
              const f = formatDate(date);
              return blockedDates.some((d) => d.date === f) ? "blocked-day" : null;
            }}
          />
        </div>

        {/* Panel del día seleccionado */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-medium text-neutral-900">
              {selectedDate.toLocaleDateString("es-ES", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </h3>
            {blocked && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                Bloqueado
              </span>
            )}
          </div>

          {blocked ? (
            <div className="space-y-4">
              {blocked.reason && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-0.5">Motivo</p>
                  <p className="text-sm text-neutral-900 font-medium">{blocked.reason}</p>
                </div>
              )}
              <button
                onClick={toggleBlocked}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Desbloquear día
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-neutral-500">Este día está disponible para reservas.</p>
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">
                  Motivo del bloqueo <span className="text-neutral-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Mal tiempo, evento privado..."
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <button
                onClick={toggleBlocked}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Bloquear día
              </button>
            </div>
          )}

          {/* Lista de días bloqueados */}
          {blockedDates.length > 0 && (
            <div className="mt-6 pt-5 border-t border-neutral-100">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                Días bloqueados ({blockedDates.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {blockedDates.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="text-neutral-900 font-medium">
                        {new Date(d.date + "T00:00:00").toLocaleDateString("es-ES", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                      {d.reason && (
                        <span className="text-neutral-400 ml-2">— {d.reason}</span>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.from("blocked_dates").delete().eq("id", d.id);
                        loadBlockedDates();
                      }}
                      className="text-red-400 hover:text-red-600 shrink-0 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}