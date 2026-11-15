import Closing from "../components/home/Closing";
import Criteria from "../components/home/Criteria";
import GlobeSection from "../components/home/GlobeSection";
import Hero from "../components/home/Hero";

export default function Home() {
  return (
    <>
      <Hero />
      <GlobeSection />
      <Criteria />
      <Closing />
    </>
  );
}
