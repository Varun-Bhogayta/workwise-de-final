import HeroSection from '@/components/HeroSection';
// import FeaturedJobs from '@/components/FeaturedJobs';
// import CategorySection from '@/components/CategorySection';
// import EmployerSection from '@/components/EmployerSection';
// import TestimonialSection from '@/components/TestimonialSection';
import CtaSection from '@/components/CtaSection';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      {/* <FeaturedJobs /> */}
      {/* <CategorySection /> */}
      {/* <EmployerSection /> */}
      {/* <TestimonialSection /> */}
      <CtaSection />
    </div>
  );
};

export default HomePage;