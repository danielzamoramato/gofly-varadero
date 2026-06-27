import NavBar      from "./components/NavBar";
import HeroSlider  from "./components/HeroSlider";
import Services    from "./components/Services";
import Pricing     from "./components/Pricing";
import Gallery     from "./components/Gallery";
import FAQ         from "./components/FAQ";
import Reviews from "./components/Reviews";
import CTASection  from "./components/CTASection";
//import Footer      from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <NavBar />
      <HeroSlider />
      <Services />
      <Pricing />
      <Gallery />
      <FAQ />
      <Reviews />
      <CTASection />
    </div>
  );
}