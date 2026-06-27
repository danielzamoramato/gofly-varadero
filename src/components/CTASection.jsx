import WhatsAppIcon from "./ui/WhatsAppIcon";
import { waLink, IG_URL, TK_URL, FB_URL } from "../utils/links";

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const WA_MSG = `Hola! Quiero reservar un vuelo en Go Fly Varadero.

Mis datos:
- Fecha:
- Hora:
- Hotel:
- Habitación:
- Nombre:
- Total de vuelos:`;

export default function CTASection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-sky-950 via-sky-900 to-teal-900 text-center">
      <p className="text-sky-300 text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">
        ¿Listo para volar?
      </p>
      <h2 className="text-2xl sm:text-3xl font-medium text-white mb-3">Reserva tu vuelo hoy</h2>
      <p className="text-sky-100/70 text-sm sm:text-base max-w-md mx-auto mb-3 leading-relaxed">
        Escríbenos por WhatsApp con tu fecha, hotel y habitación y nuestro auto te recogerá en el lugar acordado.
      </p>
      <p className="text-sky-300/80 text-sm mb-8">
        Ubicación: Meliá Internacional · Varadero
      </p>

      <div className="flex flex-col items-center gap-4">
        <a 
          href={waLink(WA_MSG)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-7 py-3.5 rounded-lg transition-colors text-base"
        >
          <WhatsAppIcon /> Reservar por WhatsApp
        </a>

        <div className="flex items-center gap-5">
          <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors" aria-label="Instagram">
            <InstagramIcon />
          </a>
          <a href={TK_URL} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors" aria-label="TikTok">
            <TikTokIcon />
          </a>
          <a href={FB_URL} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors" aria-label="Facebook">
            <FacebookIcon />
          </a>
        </div>
      </div>
    </section>
  );
}