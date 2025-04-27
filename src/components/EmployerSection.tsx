import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CompanyProps {
  id: string;
  name: string;
  logo?: string;
  jobCount: number;
}

const companies: CompanyProps[] = [
  { id: '1', name: 'Microsoft', logo: 'https://images.pexels.com/photos/7989741/pexels-photo-7989741.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', jobCount: 45 },
  { id: '2', name: 'Google', logo: 'https://images.pexels.com/photos/6446709/pexels-photo-6446709.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', jobCount: 38 },
  { id: '3', name: 'Amazon', logo: 'https://images.pexels.com/photos/7989731/pexels-photo-7989731.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', jobCount: 52 },
  { id: '4', name: 'Apple', logo: 'https://images.pexels.com/photos/7989704/pexels-photo-7989704.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', jobCount: 29 },
  { id: '5', name: 'Meta', logo: 'https://images.pexels.com/photos/3761509/pexels-photo-3761509.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', jobCount: 31 },
  { id: '6', name: 'Netflix', logo: 'https://images.pexels.com/photos/13780034/pexels-photo-13780034.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', jobCount: 18 },
  { id: '7', name: 'Spotify', logo: 'https://images.pexels.com/photos/12843102/pexels-photo-12843102.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', jobCount: 22 },
  { id: '8', name: 'Airbnb', logo: 'https://images.pexels.com/photos/12064/pexels-photo-12064.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2', jobCount: 15 },
];

const CompanyCard = ({ id, name, logo, jobCount }: CompanyProps) => {
  return (
    <Link to={`/company/${id}`} className="flex items-center p-4 bg-card border border-border rounded-lg transition-all duration-200 hover:shadow-md hover:border-primary/50">
      <Avatar className="h-12 w-12 rounded-md mr-4">
        <AvatarImage src={logo} alt={name} />
        <AvatarFallback className="rounded-md bg-primary/10 text-primary">
          {name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-muted-foreground">{jobCount} jobs</p>
      </div>
    </Link>
  );
};

const EmployerSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Top Employers</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover job opportunities from leading companies committed to hiring top talent
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {companies.map((company) => (
            <CompanyCard key={company.id} {...company} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg">
            <Link to="/companies">View All Companies</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EmployerSection;