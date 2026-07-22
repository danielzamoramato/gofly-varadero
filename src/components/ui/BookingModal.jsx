import { useState, useEffect } from "react";
import { useLang } from "../../i18n/LangContext";
import { WA_NUMBER } from "../../utils/links";
import { supabase } from "../../utils/supabase";
import WhatsAppIcon from "./WhatsAppIcon";

const MAX_PER_SLOT = 2;
const PICKUP_PRICE = 0;

// Horarios disponibles: 8:00 a 17:00 cada 30 min
const TIME_SLOTS = [];
for (let h = 8; h <= 16; h++) {
  for (let m = 0; m < 60; m += 10) {
    const hour = String(h).padStart(2, "0");
    const minute = String(m).padStart(2, "0");
    TIME_SLOTS.push(`${hour}:${minute}`);
  }
}
TIME_SLOTS.push("17:00"); // las 17:00 en punto

function todayLocal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function validPhone(phone) {
  return /^[0-9+\-\s]{8,15}$/.test(phone.trim());
}
function validDocument(doc) {
  return doc.trim().length >= 5;
}

// Extrae el número del precio ej: "$80" -> 80, "$140" -> 140
function extractPrice(priceStr) {
  const n = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

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
  const [form, setForm] = useState(EMPTY);
  const [slotCounts, setSlotCounts] = useState({}); // { "09:00": 1, "09:30": 0, ... }
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!plan) return;
    setForm(EMPTY);
    setSlotCounts({});
    setDone(false);
    setTouched({});
    loadBlockedDates();
  }, [plan]);

  async function loadBlockedDates() {
    const { data, error } = await supabase
      .from("blocked_dates")
      .select("date, start_time, end_time, reason");
    if (!error) setBlockedDates(data || []);
  }

  useEffect(() => {
    if (!form.date) {
      setSlotCounts({});
      return;
    }

    async function fetchDaySlots() {
      setLoadingSlots(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("time, status")
        .eq("date", form.date)
        .neq("status", "cancelled");

      if (!error) {
        const counts = {};
        (data || []).forEach((b) => {
          const t = b.time.slice(0, 5);
          counts[t] = (counts[t] || 0) + 1;
        });
        setSlotCounts(counts);
      }
      setLoadingSlots(false);
    }

    fetchDaySlots();
  }, [form.date]);

  if (!plan) return null;

  const isCouplePlan =
    plan.unit.toLowerCase().includes("pareja") ||
    plan.unit.toLowerCase().includes("couple");
  const dayEntries = blockedDates.filter((d) => d.date === form.date);
  const fullDayEntry = dayEntries.find((d) => !d.start_time);
  const partialEntries = dayEntries.filter((d) => d.start_time);
  const dateBlocked = !!fullDayEntry;

  function isTimeBlocked(time) {
    return partialEntries.some((e) => {
      const start = e.start_time.slice(0, 5);
      const end = e.end_time.slice(0, 5);
      return time >= start && time < end;
    });
  }

  const timeBlocked = form.time && isTimeBlocked(form.time);
  const slotFull = form.time && (slotCounts[form.time] || 0) >= MAX_PER_SLOT;

  // Precio base y subtotal
  const basePrice = extractPrice(plan.price);
  const subtotal = basePrice * form.people;
  const pickupSuffix = form.pickup
    ? lang === "en"
      ? ` + ${PICKUP_PRICE.toLocaleString()} MN (pick-up)`
      : ` + ${PICKUP_PRICE.toLocaleString()} MN (transporte)`
    : "";

  // Validaciones individuales
  const errors = {
    name: !form.name.trim(),
    id: !validDocument(form.id),
    tel: !validPhone(form.tel),
    date: !form.date || dateBlocked,
    time: !form.time || slotFull || timeBlocked,
    pickupLocation: form.pickup && !form.pickupLocation.trim(),
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const isValid = !hasErrors && !loadingSlots;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function touch(field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function handleClose() {
    if (sending) return;
    setForm(EMPTY);
    setSlotCounts({});
    setDone(false);
    setTouched({});
    onClose();
  }

  async function handleSend(e) {
    e.preventDefault();
    // Marcar todos los campos como tocados para mostrar errores
    setTouched({
      name: true,
      id: true,
      tel: true,
      date: true,
      time: true,
      pickupLocation: true,
    });
    if (hasErrors || sending) return;
    setSending(true);

    try {
      const { error } = await supabase.from("bookings").insert([
        {
          plan_name: plan.name,
          full_name: form.name.trim(),
          document_id: form.id.trim(),
          tel: form.tel.trim(),
          date: form.date,
          time: form.time,
          people: form.people,
          pickup: form.pickup,
          pickup_location: form.pickup ? form.pickupLocation.trim() : null,
          subtotal: subtotal,
          status: "pending",
        },
      ]);

      if (error) {
        console.error(error);
        alert(
          lang === "en"
            ? "Unable to save booking."
            : "No se pudo guardar la reserva.",
        );
        return;
      }

      window.open(buildMessage(), "_blank");
      setDone(true);
    } catch (err) {
      console.error(err);
      alert(
        lang === "en" ? "Unexpected error." : "Ocurrió un error inesperado.",
      );
    } finally {
      setSending(false);
    }
  }

  function buildMessage() {
    const lines =
      lang === "en"
        ? [
            `Hi! I want to book a flight at Go Fly Varadero.`,
            ``,
            `*Package:* ${plan.name} (${plan.price} ${plan.unit})`,
            `*Full name:* ${form.name}`,
            `*ID / Passport:* ${form.id}`,
            `*Phone Number:* ${form.tel}`,
            `*Date:* ${form.date}`,
            `*Time:* ${form.time}`,
            `*${isCouplePlan ? "Couples" : "People"}:* ${form.people}`,
            `*Subtotal flights:* $${subtotal} USD${pickupSuffix}`,
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
            `*${isCouplePlan ? "Parejas" : "Personas"}:* ${form.people}`,
            `*Subtotal vuelos:* $${subtotal} USD${pickupSuffix}`,
            form.pickup
              ? `*Recogida:* Sí — ${form.pickupLocation}`
              : `*Recogida:* No necesaria`,
          ];
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  // Clases de input: rojo si tocado y con error, normal si no
  function inputClass(field, extra = "") {
    const isErr = touched[field] && errors[field];
    return `w-full border rounded-lg px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
      isErr
        ? "border-red-400 bg-red-50 focus:ring-red-400"
        : "border-neutral-200 focus:ring-teal-500"
    } ${extra}`;
  }

  const ui =
    lang === "en"
      ? {
          title: "Book your flight",
          subtitle: (p) => `${p.name} · ${p.duration}`,
          name: "Full name",
          namePh: "Your full name",
          id: "ID / Passport",
          idPh: "Document number",
          tel: "Phone number",
          telPh: "+1xxxxxxxxxx",
          date: "Date",
          time: "Select time",
          people: isCouplePlan ? "Number of couples" : "Number of people",
          pickupLabel: "I need pick-up within Varadero",
          pickupWhere: "Pick-up location",
          pickupWherePh: "Hotel name or address",
          subtotalLabel: "Subtotal",
          pickupPriceLabel: "Pick-up",
          notice:
            "All details will be sent via WhatsApp once you complete the form.",
          cta: "Send via WhatsApp",
          checking: "Checking availability...",
          slotFull:
            "All flights for this time slot are fully booked. Please choose a different time.",
          slotOk: (n) =>
            `${MAX_PER_SLOT - n} spot${MAX_PER_SLOT - n === 1 ? "" : "s"} available.`,
          dateBlockedMsg: "This day is not available for bookings.",
          selectTime: "-- Select a time --",
          successTitle: "Booking sent!",
          successSub:
            "Check your WhatsApp to complete the reservation with our team.",
          close: "Close",
          errRequired: "This field is required.",
          errPhone: "Enter a valid phone number.",
          errDocument: "Enter a valid document number.",
          errSlotFull: "This time slot is full.",
          errDateBlocked: "This day is not available.",
        }
      : {
          title: "Reserva tu vuelo",
          subtitle: (p) => `${p.name} · ${p.duration}`,
          name: "Nombre completo",
          namePh: "Tu nombre completo",
          id: "CI / ID",
          idPh: "Número de documento",
          tel: "Número de teléfono",
          telPh: "+53xxxxxxxx",
          date: "Fecha",
          time: "Selecciona la hora",
          people: isCouplePlan ? "Cantidad de parejas" : "Cantidad de personas",
          pickupLabel: "Necesito recogida dentro de Varadero",
          pickupWhere: "Lugar de recogida",
          pickupWherePh: "Nombre del hotel o dirección",
          subtotalLabel: "Subtotal",
          pickupPriceLabel: "Transporte",
          notice:
            "Todos los detalles serán enviados por WhatsApp una vez completado el formulario.",
          cta: "Enviar por WhatsApp",
          checking: "Verificando disponibilidad...",
          slotFull:
            "Todos los vuelos para este horario están reservados. Elige otra hora.",
          slotOk: (n) => {
            const free = Math.max(MAX_PER_SLOT - n, 0);
            return `${free} lugar${free === 1 ? "" : "es"} disponible${free === 1 ? "" : "s"}.`;
          },
          dateBlockedMsg: "Este día no está disponible para reservas.",
          selectTime: "-- Selecciona una hora --",
          successTitle: "¡Reserva enviada!",
          successSub:
            "Revisa tu WhatsApp para completar la reserva con nuestro equipo.",
          close: "Cerrar",
          errRequired: "Este campo es obligatorio.",
          errPhone: "Ingresa un número de teléfono válido.",
          errDocument: "Ingresa un número de documento válido.",
          errSlotFull: "Este horario está lleno.",
          errDateBlocked: "Este día no está disponible.",
        };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-medium text-neutral-900">{ui.title}</h3>

            <p className="text-xs text-teal-600 mt-0.5">
              {ui.subtitle(plan)} · {plan.price} {plan.unit}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 shrink-0"
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

        {done ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-teal-600"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-medium text-neutral-900 mb-1">
              {ui.successTitle}
            </p>
            <p className="text-sm text-neutral-500 mb-6">{ui.successSub}</p>
            <button
              onClick={handleClose}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {ui.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">
                {ui.name}
              </label>
              <input
                type="text"
                maxLength={80}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => touch("name")}
                placeholder={ui.namePh}
                className={inputClass("name")}
              />
              {touched.name && errors.name && (
                <p className="text-xs text-red-500 mt-1">{ui.errRequired}</p>
              )}
            </div>

            {/* ID */}
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">
                {ui.id}
              </label>
              <input
                type="text"
                maxLength={30}
                value={form.id}
                onChange={(e) => set("id", e.target.value)}
                onBlur={() => touch("id")}
                placeholder={ui.idPh}
                className={inputClass("id")}
              />
              {touched.id && errors.id && (
                <p className="text-xs text-red-500 mt-1">{ui.errDocument}</p>
              )}
            </div>

            {/* Tel */}
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">
                {ui.tel}
              </label>
              <input
                type="tel"
                maxLength={15}
                value={form.tel}
                onChange={(e) => set("tel", e.target.value)}
                onBlur={() => touch("tel")}
                placeholder={ui.telPh}
                className={inputClass("tel")}
              />
              {touched.tel && errors.tel && (
                <p className="text-xs text-red-500 mt-1">{ui.errPhone}</p>
              )}
            </div>

            {/* People */}
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">
                {ui.people}
              </label>
              <select
                value={form.people}
                onChange={(e) => set("people", parseInt(e.target.value) || 1)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Date + Time */}
            {/* Date */}
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">
                {ui.date}
              </label>
              <input
                type="date"
                value={form.date}
                min={todayLocal()}
                onChange={(e) => {
                  set("date", e.target.value);
                  setSlotCounts({});
                  touch("date");
                }}
                onBlur={() => touch("date")}
                className={inputClass("date")}
              />

              {touched.date && dateBlocked && (
                <p className="text-xs text-red-500 mt-1">
                  {ui.dateBlockedMsg}
                  {fullDayEntry?.reason ? ` — ${fullDayEntry.reason}` : ""}
                </p>
              )}
              {touched.date && errors.date && !dateBlocked && (
                <p className="text-xs text-red-500 mt-1">{ui.errRequired}</p>
              )}
              {form.date && !dateBlocked && partialEntries.length > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  {lang === "en"
                    ? "Some hours are unavailable today: "
                    : "Algunas horas no están disponibles hoy: "}
                  {partialEntries
                    .map(
                      (e) =>
                        `${e.start_time.slice(0, 5)}–${e.end_time.slice(0, 5)}`,
                    )
                    .join(", ")}
                </p>
              )}
            </div>

            {/* Time */}
            {form.date && !dateBlocked && (
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-2">
                  {ui.time}
                </label>

                {loadingSlots ? (
                  <p className="text-xs text-neutral-400">{ui.checking}</p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-1 border border-neutral-100 rounded-lg p-2">
                    {TIME_SLOTS.map((slot) => {
                      const count = slotCounts[slot] || 0;
                      const full = count >= MAX_PER_SLOT;
                      const blocked = isTimeBlocked(slot);
                      const disabled = full || blocked;
                      const selected = form.time === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            set("time", slot);
                            touch("time");
                          }}
                          className={`text-xs font-medium py-1.5 rounded-md border transition-colors ${
                            disabled
                              ? "bg-neutral-100 text-neutral-300 border-neutral-100 cursor-not-allowed line-through"
                              : selected
                                ? "bg-teal-600 text-white border-teal-600"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-teal-400"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}

                {touched.time && errors.time && (
                  <p className="text-xs text-red-500 mt-1">{ui.errRequired}</p>
                )}
              </div>
            )}
            {/* Pickup toggle */}
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
              <span className="text-sm text-neutral-700">{ui.pickupLabel}</span>
            </div>

            {/* Pickup location */}
            {form.pickup && (
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">
                  {ui.pickupWhere}
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.pickupLocation}
                  onChange={(e) => set("pickupLocation", e.target.value)}
                  onBlur={() => touch("pickupLocation")}
                  placeholder={ui.pickupWherePh}
                  className={inputClass("pickupLocation")}
                />
                {touched.pickupLocation && errors.pickupLocation && (
                  <p className="text-xs text-red-500 mt-1">{ui.errRequired}</p>
                )}
              </div>
            )}

            {/* Subtotal */}
            <div className="bg-neutral-50 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">
                  {plan.price} × {form.people}{" "}
                  {isCouplePlan
                    ? lang === "en"
                      ? `couple${form.people !== 1 ? "s" : ""}`
                      : `pareja${form.people !== 1 ? "s" : ""}`
                    : lang === "en"
                      ? `person${form.people !== 1 ? "s" : ""}`
                      : "persona" + (form.people !== 1 ? "s" : "")}
                </span>

                <span className="font-medium text-neutral-900">
                  ${subtotal} USD
                </span>
              </div>
              {form.pickup && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    {ui.pickupPriceLabel}
                  </span>
                  <span className="font-medium text-neutral-900">
                    {PICKUP_PRICE.toLocaleString()} MN
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium border-t border-neutral-200 pt-1.5 mt-1.5">
                <span className="text-neutral-700">{ui.subtotalLabel}</span>
                <span className="text-teal-600">
                  ${subtotal} USD
                  {form.pickup ? ` + ${PICKUP_PRICE.toLocaleString()} MN` : ""}
                </span>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 bg-neutral-50 rounded-lg p-3">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-400 shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {ui.notice}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors ${
                !hasErrors && !sending
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
