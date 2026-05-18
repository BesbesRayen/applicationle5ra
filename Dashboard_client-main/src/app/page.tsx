import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import PartnersPreview from '@/components/PartnersPreview';
import DownloadCTA from '@/components/DownloadCTA';

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <PartnersPreview />
      <DownloadCTA />
    </>
  );
}
