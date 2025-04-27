import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserIcon, Briefcase } from 'lucide-react';

const CtaSection = () => {
  return (
    <section className="py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="bg-card border border-border rounded-xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to advance your career?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Whether you're looking for your dream job or searching for top talent, WorkWise is here to help you succeed.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-secondary p-8 rounded-lg border border-border transition-all duration-200 hover:border-primary/40 hover:shadow-md">
              <div className="bg-primary/10 p-4 rounded-full inline-block mb-4">
                <UserIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Job Seekers</h3>
              <p className="text-muted-foreground mb-6">
                Discover thousands of job opportunities and take the next step in your career journey.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link to="/register">Create Account</Link>
              </Button>
            </div>
            
            <div className="bg-secondary p-8 rounded-lg border border-border transition-all duration-200 hover:border-primary/40 hover:shadow-md">
              <div className="bg-primary/10 p-4 rounded-full inline-block mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Employers</h3>
              <p className="text-muted-foreground mb-6">
                Post jobs and find the perfect candidates to help grow your business.
              </p>
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link to="/post-job">Post a Job</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;