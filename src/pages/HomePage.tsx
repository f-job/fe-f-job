import { HeroSection } from '@/components/home/HeroSection';
import { QuickTags } from '@/components/home/QuickTags';
import { CategoriesGrid } from '@/components/home/CategoriesGrid';
import { UrgentJobs } from '@/components/home/UrgentJobs';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickTags />
      <CategoriesGrid />
      <UrgentJobs />
    </>
  );
}
