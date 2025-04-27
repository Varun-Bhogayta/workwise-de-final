import { useNavigate } from "react-router-dom";
import { SearchIcon, BriefcaseIcon, TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const searchInput = form.elements.namedItem("search") as HTMLInputElement;

    // Get the search value and trim whitespace
    const searchValue = searchInput.value.trim();

    // Only navigate if search term is not empty
    if (searchValue) {
      // Encode the search value to handle special characters
      navigate(`/jobs?search=${encodeURIComponent(searchValue)}`);
    }
  };

  return (
    <div className="relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 -z-10" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-5 -z-10" />

      <div className="container mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight animate-fade-in">
            Find Your{" "}
            <span className="text-primary bg-clip-text">Dream Job</span> Today
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with top employers and discover opportunities that match
            your skills and aspirations.
          </p>

          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 mt-8 max-w-2xl mx-auto"
          >
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                name="search"
                placeholder="Job title, keywords, or company"
                className="pl-10 h-12"
              />
            </div>
            <Button type="submit" size="lg" className="h-12">
              Search Jobs
            </Button>
          </form>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => navigate("/jobs")}
              className="flex items-center"
            >
              <BriefcaseIcon className="mr-2 h-4 w-4" />
              Browse All Jobs
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/companies")}
              className="flex items-center"
            >
              <TrendingUpIcon className="mr-2 h-4 w-4" />
              Top Companies
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
