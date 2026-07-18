import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabaseAdmin as supabase } from "../utils/supabase";

export default function AvailabilityManager() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState([]);
  const [reason, setReason]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [showCustom, setShowCustom]     = useState(false);
  const [customStart, setCustomStart]   = useState("08:00");
  const [customEnd, setCustomEnd]       = useState("17:00");

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

  function formatTimeRange(start, end) {
    return `${start.slice(0, 5)} – ${end.slice(0, 5)}`;
  }

  const currentDate  = formatDate(selectedDate);
  const dateEntries  = blockedDates.filter((d) => d.date === currentDate);
  const fullDayEntry = dateEntries.find((d) => !d.start_time && !d.end_time);
  const partialEntries = dateEntries.filter((d) => d.start_time && d.end_time);

  async function addBlock(startTime, endTime) {
    await supabase.from("blocked_dates").insert([{
      date: currentDate,
      start_time: startTime,
      end_time: endTime,
      reason: reason || null,
    }]);
    setReason("");
    setShowCustom(false);
    loadBlockedDates();
  }

  async function deleteBlock(id) {
    await supabase.from("blocked_dates").delete().eq("id", id);
    loadBlockedDates();
  }

  if (loading) return <p className="text-center py-12 text-sm text-neutral-400">Cargando...</p>;

  return (
    <div>
      <style>{`
        .react-calendar__tile.blocked-day-full {
          background: #fee2e2 !important;
          color: #dc2626 !important;
          font-weight: 600;
        }
        .react-calendar__tile.blocked-day-full:hover,
        .react-calendar__tile.blocked-day-full:focus {
          background: #fecaca !important;
        }
        .react-calendar__tile.blocked-day-full.react-calendar__tile--active {
          background: #dc2626 !important;
          color: white !important;
        }
        .react-calendar__tile.blocked-day-partial {
          background: #ffedd5 !important;
          color: #c2410c !important;
          font-weight: 600;
        }
        .react-calendar__tile.blocked-day-partial:hover,
        .react-calendar__tile.blocked-day-partial:focus {
          background: #fed7aa !important;
        }
        .react-calendar__tile.blocked-day-partial.react-calendar__tile--active {
          background: #c2410c !important;
          color: white !important;
        }
      `}</style>

      <div className="mb-6">
        <h2 className="text-lg font-medium text-neutral-900">Disponibilidad</h2>
        <p className="text-sm text-neutral-500">
          Haz clic sobre un día para bloquearlo completo o solo un horario específico.
        </p>
        <div className="flex gap-4 mt-2 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-200 inline-block" /> Día completo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-200 inline-block" /> Horario parcial
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Calendario */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shrink-0">
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            tileClassName={({ date }) => {
              const f = formatDate(date);
              const entries = blockedDates.filter((d) => d.date === f);
              if (entries.length === 0) return null;
              return entries.some((e) => !e.start_time) ? "blocked-day-full" : "blocked-day-partial";
            }}
          />
        </div>

        {/* Panel del día seleccionado */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <h3 className="font-medium text-neutral-900">
              {selectedDate.toLocaleDateString("es-ES", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </h3>
            {fullDayEntry && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                Día completo bloqueado
              </span>
            )}
            {!fullDayEntry && partialEntries.length > 0 && (
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                {partialEntries.length} horario{partialEntries.length !== 1 ? "s" : ""} bloqueado{partialEntries.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Día completo bloqueado */}
          {fullDayEntry ? (
            <div className="space-y-4 mb-6">
              {fullDayEntry.reason && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-0.5">Motivo</p>
                  <p className="text-sm text-neutral-900 font-medium">{fullDayEntry.reason}</p>
                </div>
              )}
              <button
                onClick={() => deleteBlock(fullDayEntry.id)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Desbloquear día completo
              </button>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {/* Bloqueos parciales existentes */}
              {partialEntries.length > 0 && (
                <div className="space-y-2">
                  {partialEntries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-3 bg-orange-50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-orange-700">
                          {formatTimeRange(e.start_time, e.end_time)}
                        </p>
                        {e.reason && <p className="text-xs text-neutral-500 mt-0.5">{e.reason}</p>}
                      </div>
                      <button
                        onClick={() => deleteBlock(e.id)}
                        className="text-red-400 hover:text-red-600 shrink-0 transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para agregar nuevo bloqueo */}
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">
                  Motivo <span className="text-neutral-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Mal tiempo, evento privado..."
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => addBlock(null, null)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Bloquear día completo
                </button>
                <button
                  onClick={() => addBlock("08:00", "13:00")}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Bloquear mañana (08:00–13:00)
                </button>
                <button
                  onClick={() => addBlock("13:00", "17:00")}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Bloquear tarde (13:00–17:00)
                </button>
                <button
                  onClick={() => setShowCustom((s) => !s)}
                  className="flex items-center gap-2 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Horario personalizado
                </button>
              </div>

              {showCustom && (
                <div className="flex items-center gap-2 flex-wrap bg-neutral-50 rounded-lg p-3">
                  <input
                    type="time"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="border border-neutral-200 rounded-lg px-2 py-1.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-sm text-neutral-500">a</span>
                  <input
                    type="time"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="border border-neutral-200 rounded-lg px-2 py-1.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={() => addBlock(customStart, customEnd)}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Añadir
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lista general de todos los días con bloqueos */}
          {blockedDates.length > 0 && (
            <div className="pt-5 border-t border-neutral-100">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                Todos los bloqueos ({blockedDates.length})
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
                      <span className="text-neutral-500 ml-2">
                        {d.start_time ? formatTimeRange(d.start_time, d.end_time) : "Día completo"}
                      </span>
                      {d.reason && <span className="text-neutral-400 ml-2">— {d.reason}</span>}
                    </div>
                    <button
                      onClick={() => deleteBlock(d.id)}
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