import { useState, useEffect } from "react";
import { useLang } from "../../i18n/LangContext";
import { WA_NUMBER } from "../../utils/links";
import { supabase } from "../../utils/supabase";
import WhatsAppIcon from "./WhatsAppIcon";

const MAX_PER_SLOT = 2;

const EMPTY = {
  name: "",
  id: "",
  tel: "",
  date: "",
  time: "",
  people: 1,
  pickup: false,
  pickupLocation: "",
};

export default function BookingModal({ plan, onClose }) {
  const { lang } = useLang();
  const [form, setForm]           = useState(EMPTY);
  const [slotCount, setSlotCount] = useState(null); // null = no consultado
  const [checking, setChecking]   = useState(false);
  const [sending, setSending]     = useState(false);
  const [done, setDone]           = useState(false);

  // Reset al abrir con nuevo plan
  useEffect(() => {
    setForm(EMPTY);
    setSlotCount(null);
    setDone(false);
  }, [plan]);

  // Consultar disponibilidad cuando date y time están completos
  useEffect(() => {
    if (!form.date || !form.time) { setSlotCount(null); return; }

    const timer = setTimeout(async () => {
      setChecking(true);
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("date", form.date)
        .eq("time", form.time);
      setSlotCount(count ?? 0);
      setChecking(false);
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [form.date, form.time]);

  if (!plan) return null;

  const slotFull = slotCount !== null && slotCount >= MAX_PER_SLOT;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSend(e) {
    e.preventDefault();
    if (slotFull) return;

    setSending(true);

    // Guardar reserva en Supabase
    await supabase.from("bookings").insert([{
      plan_name:       plan.name,
      full_name:       form.name,
      document_id:     form.id,
      tel:             form.tel,
      date:            form.date,
      time:            form.time,
      people:          form.people,
      pickup:          form.pickup,
      pickup_location: form.pickup ? form.pickupLocation : null,
    }]);

    // Abrir WhatsApp
    window.open(buildMessage(), "_blank");
    setSending(false);
    setDone(true);
  }

  function buildMessage() {
    const lines = lang === "en"
      ? [
          `Hi! I want to book a flight at Go Fly Varadero.`,
          ``,
          `*Package:* ${plan.name} (${plan.price} ${plan.unit})`,
          `*Full name:* ${form.name}`,
          `*ID / Passport:* ${form.id}`,
          `*Phone Number:* ${form.tel}`,
          `*Date:* ${form.date}`,
          `*Time:* ${form.time}`,
          `*People:* ${form.people}`,
          form.pickup
            ? `*Pick-up:* Yes — ${form.pickupLocation}`
            : `*Pick-up:* Not needed`,
        ]
      : [
          `Hola! Quiero reservar un vuelo en Go Fly Varadero.`,
          ``,
          `*Paquete:* ${plan.name} (${plan.price} ${plan.unit})`,
          `*Nombre completo:* ${form.name}`,
          `*CI / ID:* ${form.id}`,
          `*Número de Teléfono:* ${form.tel}`,
          `*Fecha:* ${form.date}`,
          `*Hora:* ${form.time}`,
          `*Personas:* ${form.people}`,
          form.pickup
            ? `*Recogida:* Sí — ${form.pickupLocation}`
            : `*Recogida:* No necesaria`,
        ];

    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const isValid = form.name && form.id && form.tel && form.date && form.time &&
    (!form.pickup || form.pickupLocation) && !slotFull;

  const ui = lang === "en" ? {
    title: "Book your flight",
    subtitle: (p) => `${p.name} · ${p.price} ${p.unit} · ${p.duration}`,
    name: "Full name", namePh: "Your full name",
    id: "ID / Passport", idPh: "Document number",
    tel: "Phone number", telPh: "+1xxxxxxxxxx",
    date: "Date", time: "Time",
    pickupLabel: "I need pick-up within Varadero",
    pickupWhere: "Pick-up location", pickupWherePh: "Hotel name or address",
    notice: "All details will be sent via WhatsApp once you complete the form.",
    cta: "Send via WhatsApp",
    checking: "Checking availability...",
    slotFull: "All flights for this time slot are fully booked. Please choose a different time.",
    slotOk: (n) => `${MAX_PER_SLOT - n} spot${MAX_PER_SLOT - n === 1 ? "" : "s"} available at this time.`,
    successTitle: "Booking sent!",
    successSub: "Check your WhatsApp to complete the reservation with our team.",
    close: "Close",
  } : {
    title: "Reserva tu vuelo",
    subtitle: (p) => `${p.name} · ${p.price} ${p.unit} · ${p.duration}`,
    name: "Nombre completo", namePh: "Tu nombre completo",
    id: "CI / ID", idPh: "Número de documento",
    tel: "Número de teléfono", telPh: "+53xxxxxxxx", 
    date: "Fecha", time: "Hora",
    pickupLabel: "Necesito recogida dentro de Varadero",
    pickupWhere: "Lugar de recogida", pickupWherePh: "Nombre del hotel o dirección",
    notice: "Todos los detalles serán enviados por WhatsApp una vez completado el formulario.",
    cta: "Enviar por WhatsApp",
    checking: "Verificando disponibilidad...",
    slotFull: "Todos los vuelos para este horario están reservados. Por favor elige otra hora.",
    slotOk: (n) => `${MAX_PER_SLOT - n} lugar${MAX_PER_SLOT - n === 1 ? "" : "es"} disponible${MAX_PER_SLOT - n === 1 ? "" : "s"} en este horario.`,
    successTitle: "¡Reserva enviada!",
    successSub: "Revisa tu WhatsApp para completar la reserva con nuestro equipo.",
    close: "Cerrar",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-medium text-neutral-900">{ui.title}</h3>
            <p className="text-xs text-teal-600 mt-0.5">{ui.subtitle(plan)}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-medium text-neutral-900 mb-1">{ui.successTitle}</p>
            <p className="text-sm text-neutral-500 mb-6">{ui.successSub}</p>
            <button
              onClick={onClose}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {ui.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">{ui.name}</label>
              <input
                type="text" required maxLength={80}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={ui.namePh}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* ID */}
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">{ui.id}</label>
              <input
                type="text" required maxLength={30}
                value={form.id}
                onChange={(e) => set("id", e.target.value)}
                placeholder={ui.idPh}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

             <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">{ui.tel}</label>
              <input
                type="tel" required maxLength={11}
                value={form.tel}
                onChange={(e) => set("tel", e.target.value)}
                placeholder={ui.telPh}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">
                 {lang === "en" ? "Number of people" : "Cantidad de personas"}
              </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={form.people}
                  onChange={(e) => set("people", parseInt(e.target.value) || 1)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
              </div>
            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">{ui.date}</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => { set("date", e.target.value); setSlotCount(null); }}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">{ui.time}</label>
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => { set("time", e.target.value); setSlotCount(null); }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 ${
                    slotFull ? "border-red-400 focus:ring-red-400" : "border-neutral-200 focus:ring-teal-500"
                  }`}
                />
              </div>
            </div>

            {/* Slot status */}
            {form.date && form.time && (
              <div className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                checking
                  ? "bg-neutral-50 text-neutral-400"
                  : slotFull
                  ? "bg-red-50 text-red-600"
                  : slotCount !== null
                  ? "bg-teal-50 text-teal-700"
                  : ""
              }`}>
                {checking ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    {ui.checking}
                  </>
                ) : slotFull ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {ui.slotFull}
                  </>
                ) : slotCount !== null ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {ui.slotOk(slotCount)}
                  </>
                ) : null}
              </div>
            )}

            {/* Pickup toggle */}
            <div
              onClick={() => set("pickup", !form.pickup)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                form.pickup ? "border-teal-500 bg-teal-50" : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                form.pickup ? "bg-teal-600 border-teal-600" : "border-neutral-300"
              }`}>
                {form.pickup && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-neutral-700">{ui.pickupLabel}</span>
            </div>

            {/* Pickup location */}
            {form.pickup && (
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">{ui.pickupWhere}</label>
                <input
                  type="text" maxLength={100}
                  value={form.pickupLocation}
                  onChange={(e) => set("pickupLocation", e.target.value)}
                  placeholder={ui.pickupWherePh}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {/* Notice */}
            <div className="flex items-start gap-2 bg-neutral-50 rounded-lg p-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-neutral-500 leading-relaxed">{ui.notice}</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || sending}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors ${
                isValid && !sending
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              }`}
            >
              <WhatsAppIcon /> {sending ? "..." : ui.cta}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}