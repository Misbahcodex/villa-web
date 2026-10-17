import { Hero } from "@/components/home/Hero";
import { ServicesSection } from "@/components/home/ServicesSection";
import { BentoDarkSection } from "@/components/home/BentoDarkSection";
import { StayLongSection } from "@/components/home/StayLongSection";
import { ExperiencesDarkSection } from "@/components/home/ExperiencesDarkSection";
import { JournalSection } from "@/components/home/JournalSection";

export default function HomePage() {
  return (
    <>
      {/* 1. Hero: STAY WITH COMFORT + Panoramic Photo + 4 Colorful Bento Cards */}
      <Hero />

      {/* 2. Service We Provide (3-Column Asymmetric Layout: Polaroid + Arch + Copy) */}
      <ServicesSection />

      {/* 3. Dark Bento Section (Yellow Arch Card + Sand Event Card + Dark Daisy Card) */}
      <BentoDarkSection />

      {/* 4. Stay Long, Save More (2-Column Layout with Floating 36%/15% Badge) */}
      <StayLongSection />

      {/* 5. Experiences You Get (3-Column Layout: Vertical Menu + Signpost + Succession) */}
      <ExperiencesDarkSection />

      {/* 6. The Blog / Journal (3-Column Editorial Article Cards) */}
      <JournalSection />
    </>
  );
}
