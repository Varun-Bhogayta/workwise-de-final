import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import JobCard from "@/components/JobCard";

interface Job {
  _id: string;
  title: string;
  company: {
    _id: string;
    name: string;
    logo?: string;
  };
  location: string;
  type: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  postedAt: string;
  skills?: string[];
  featured?: boolean;
}

// Sample jobs data for demo
const sampleJobs: Job[] = [
  {
    _id: "1",
    title: "Senior Frontend Developer",
    company: {
      _id: "101",
      name: "TechCorp",
      logo: "https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2",
    },
    location: "San Francisco, CA",
    type: "Full-time",
    salary: {
      min: 120000,
      max: 160000,
      currency: "USD",
    },
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    skills: ["React", "TypeScript", "CSS", "Node.js"],
    featured: true,
  },
  {
    _id: "2",
    title: "Product Manager",
    company: {
      _id: "102",
      name: "InnovateCo",
      logo: "https://images.pexels.com/photos/15031642/pexels-photo-15031642.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2",
    },
    location: "New York, NY",
    type: "Full-time",
    salary: {
      min: 110000,
      max: 150000,
      currency: "USD",
    },
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    skills: ["Product Strategy", "Agile", "User Research", "Roadmapping"],
    featured: true,
  },
  {
    _id: "3",
    title: "Data Scientist",
    company: {
      _id: "103",
      name: "DataViz",
      logo: "https://images.pexels.com/photos/7887800/pexels-photo-7887800.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2",
    },
    location: "Remote",
    type: "Full-time",
    salary: {
      min: 105000,
      max: 140000,
      currency: "USD",
    },
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    skills: ["Python", "Machine Learning", "SQL", "Data Analysis"],
    featured: true,
  },
  {
    _id: "4",
    title: "DevOps Engineer",
    company: {
      _id: "104",
      name: "CloudWorks",
      logo: "https://images.pexels.com/photos/5668859/pexels-photo-5668859.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2",
    },
    location: "Austin, TX",
    type: "Full-time",
    salary: {
      min: 115000,
      max: 145000,
      currency: "USD",
    },
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
    featured: false,
  },
  {
    _id: "5",
    title: "UI/UX Designer",
    company: {
      _id: "105",
      name: "DesignHub",
      logo: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2",
    },
    location: "Los Angeles, CA",
    type: "Full-time",
    salary: {
      min: 90000,
      max: 120000,
      currency: "USD",
    },
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    skills: ["Figma", "Adobe XD", "UI Design", "User Research", "Prototyping"],
    featured: false,
  },
  {
    _id: "6",
    title: "Backend Developer",
    company: {
      _id: "106",
      name: "ServerStack",
      logo: "https://images.pexels.com/photos/7367019/pexels-photo-7367019.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2",
    },
    location: "Seattle, WA",
    type: "Full-time",
    salary: {
      min: 110000,
      max: 145000,
      currency: "USD",
    },
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    skills: ["Java", "Spring Boot", "Microservices", "SQL", "REST API"],
    featured: false,
  },
];

const FeaturedJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // In a real app, this would fetch from the backend
        // const response = await axios.get('/api/jobs/featured');
        // setJobs(response.data);

        // Using sample data for demo
        setJobs(sampleJobs);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching featured jobs:", error);
        setJobs(sampleJobs); // Fallback to sample data
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Jobs</h2>
            <p className="text-muted-foreground">
              Explore our handpicked opportunities from top employers
            </p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link to="/jobs">View All Jobs</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-md bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-4/5"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="h-9 bg-muted rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedJobs;
