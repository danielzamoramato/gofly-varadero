import { IG_URL, TK_URL, FB_URL } from "../utils/links";

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="px-6 py-8 border-t border-neutral-200">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-medium text-neutral-900 text-sm">Go Fly Varadero</span>
        <span className="text-xs text-neutral-400">© 2026 · Varadero, Cuba · Todos los derechos reservados</span>
        <div className="flex items-center gap-3">
          <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-sky-500 transition-colors" aria-label="Instagram">
            <InstagramIcon />
          </a>
          <a href={TK_URL} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-900 transition-colors" aria-label="TikTok">
            <TikTokIcon />
          </a>
          <a href={FB_URL} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-blue-600 transition-colors" aria-label="Facebook">
            <FacebookIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}