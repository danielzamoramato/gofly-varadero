export const WA_NUMBER = "5363919769";
export const IG_URL    = "https://www.instagram.com/go_fly_varadero";
export const TK_URL    = "https://www.tiktok.com/@go_fly_cuba";
export const FB_URL    = "https://www.facebook.com/share/18FXeTY4HL/";

export function waLink(msg = "Hola! Quiero reservar un vuelo en Go Fly Varadero") {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}