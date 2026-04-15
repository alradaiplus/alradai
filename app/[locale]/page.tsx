import Hero from '@/components/sections/Hero';
import Stats from '@/components/sections/Stats';
import About from '@/components/sections/About';
import WhyUs from '@/components/sections/WhyUs';
import Services from '@/components/sections/Services';
import Projects from '@/components/sections/Projects';
import Testimonials from '@/components/sections/Testimonials';
import FAQ from '@/components/sections/FAQ';
import CTA from '@/components/sections/CTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <About />
      <WhyUs />
      <Services />
      <Projects />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}
