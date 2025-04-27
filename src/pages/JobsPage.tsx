/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
  where,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import JobCard from "@/components/JobCard";
import { Search, Briefcase, MapPin, DollarSign } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface Employer {
  id: string;
  company_name: string;
  company_logo_url?: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  type: string;
  category: string;
  company: string; // company ID
  isRemote: boolean;
  status: string;
  isFeatured: boolean;
  applicationDeadline: Timestamp;
  education: string;
  experience: {
    min: number;
    max: number;
  };
  salary: {
    min: number;
    max: number;
    currency: string;
    isNegotiable: boolean;
  };
  skills: string[];
  views: number;
  applications: any[]; // Array of application references
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Added fields for UI compatibility
  employer?: Employer;
}

// Define the expected JobCard component props structure
interface JobCardProps {
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

export default function JobsPage() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    type: "all_types", // Changed from "" to a valid string
    location: "",
    salary: "any_salary", // Changed from "" to a valid string
  });

  // Use useCallback to memoize the fetchJobs function to prevent infinite renders
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      // Create a base query to get all jobs ordered by creation date
      let jobsQuery = query(
        collection(db, "jobs"),
        orderBy("createdAt", "desc")
      );

      // Apply search filters if provided
      if (filters.search) {
        // Note: Firestore doesn't support direct text search
        // This is a simple filter that can be enhanced with a more advanced solution
        jobsQuery = query(
          collection(db, "jobs"),
          where("title", ">=", filters.search),
          where("title", "<=", filters.search + "\uf8ff"),
          orderBy("title")
        );
      }

      // For type filter
      if (filters.type && filters.type !== "all_types") {
        if (filters.type === "Remote") {
          jobsQuery = query(
            collection(db, "jobs"),
            where("isRemote", "==", true),
            orderBy("createdAt", "desc")
          );
        } else {
          jobsQuery = query(
            collection(db, "jobs"),
            where("type", "==", filters.type),
            orderBy("createdAt", "desc")
          );
        }
      }

      // For location filter - basic implementation
      if (filters.location) {
        jobsQuery = query(
          collection(db, "jobs"),
          where("location", ">=", filters.location),
          where("location", "<=", filters.location + "\uf8ff"),
          orderBy("location")
        );
      }

      const querySnapshot = await getDocs(jobsQuery);

      // Get all employer IDs from jobs to fetch employer data
      const employerIds = new Set();
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.company) employerIds.add(data.company);
      });

      // Fetch employer data
      const employers: Record<string, Employer> = {};
      if (employerIds.size > 0) {
        const employerPromises = Array.from(employerIds).map(
          async (employerId) => {
            try {
              // First try to get from profiles collection (where employer account data is stored)
              const profileDoc = await getDocs(
                query(collection(db, "profiles"), where("id", "==", employerId))
              );

              if (!profileDoc.empty) {
                const profileData = profileDoc.docs[0].data();
                employers[employerId as string] = {
                  id: employerId as string,
                  company_name: profileData.company_name || "Unknown Company",
                  company_logo_url: profileData.company_logo_url || undefined,
                };
                return;
              }

              // If not found in profiles, try the companies collection
              const companyDoc = await getDocs(
                query(
                  collection(db, "companies"),
                  where("id", "==", employerId)
                )
              );

              if (!companyDoc.empty) {
                const companyData = companyDoc.docs[0].data();
                employers[employerId as string] = {
                  id: employerId as string,
                  company_name:
                    companyData.name ||
                    companyData.company_name ||
                    "Unknown Company",
                  company_logo_url:
                    companyData.logo ||
                    companyData.company_logo_url ||
                    undefined,
                };
                return;
              }

              // If still not found, use a fallback
              employers[employerId as string] = {
                id: employerId as string,
                company_name: "Unknown Company",
                company_logo_url: undefined,
              };
            } catch (error) {
              console.error("Error fetching employer:", error);
              // Create a fallback entry
              employers[employerId as string] = {
                id: employerId as string,
                company_name: "Unknown Company",
                company_logo_url: undefined,
              };
            }
          }
        );

        await Promise.all(employerPromises);
      }

      // Process job data with employer information
      const jobsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          employer: employers[data.company],
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
          applicationDeadline: data.applicationDeadline?.toDate
            ? data.applicationDeadline.toDate()
            : null,
        };
      }) as Job[];

      // Apply salary filter here since it requires client-side filtering
      let filteredJobs = jobsList;
      if (filters.salary && filters.salary !== "any_salary") {
        const [minSalary, maxSalary] = filters.salary.split("-").map(Number);
        filteredJobs = jobsList.filter((job) => {
          const jobMin = job.salary?.min || 0;
          return (
            jobMin >= minSalary && (maxSalary ? jobMin <= maxSalary : true)
          );
        });
      }

      setJobs(filteredJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);

      // Check if it's a missing index error and show a more descriptive message
      if (
        error instanceof Error &&
        error.message.includes("requires an index")
      ) {
        console.warn(
          "Firebase index required. Please check the URL in the console to create the required index."
        );

        // Set empty array to avoid showing stale data
        setJobs([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]); // Only recreate when filters change

  // Fetch jobs when component mounts or filters change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]); // Now this won't cause an infinite loop

  // Function to transform our Firebase job data to match JobCard expectations
  const transformJob = (job: Job): JobCardProps => {
    const getDateString = (timestamp: any) => {
      if (!timestamp) return new Date().toLocaleDateString();
      if (timestamp instanceof Date) return timestamp.toLocaleDateString();
      if (typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleDateString();
      }
      return new Date().toLocaleDateString();
    };

    // Get company name from proper sources
    const getCompanyName = () => {
      // 1. If employer data is already fetched and stored in the job object
      if (job.employer?.company_name) {
        return job.employer.company_name;
      }

      // 2. Check if we can fetch from companies collection
      // This will be handled asynchronously after component renders

      // Return a placeholder only as last resort
      return "Loading...";
    };

    return {
      _id: job.id,
      title: job.title,
      company: {
        _id: job.company,
        name: getCompanyName(),
        logo: job.employer?.company_logo_url,
      },
      location: job.location + (job.isRemote ? " (Remote)" : ""),
      type: job.type,
      salary: {
        min: job.salary?.min || 0,
        max: job.salary?.max || 0,
        currency: job.salary?.currency || "INR",
      },
      postedAt: getDateString(job.createdAt),
      skills: job.skills || [],
      featured: job.isFeatured || false,
    };
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find Your Next Opportunity</h1>
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-9"
            />
          </div>

          <Select
            value={filters.type}
            onValueChange={(value) => setFilters({ ...filters, type: value })}
          >
            <SelectTrigger className="h-[42px]">
              <Briefcase className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">All Types</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Location..."
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              className="pl-9"
            />
          </div>

          <Select
            value={filters.salary}
            onValueChange={(value) => setFilters({ ...filters, salary: value })}
          >
            <SelectTrigger className="h-[42px]">
              <DollarSign className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Salary Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any_salary">Any Salary</SelectItem>
              <SelectItem value="0-50000">$0 - $50,000</SelectItem>
              <SelectItem value="50000-100000">$50,000 - $100,000</SelectItem>
              <SelectItem value="100000-150000">$100,000 - $150,000</SelectItem>
              <SelectItem value="150000-200000">$150,000 - $200,000</SelectItem>
              <SelectItem value="200000-1000000">$200,000+</SelectItem>
            </SelectContent>
          </Select>

          <Button type="submit" className="md:col-span-4 h-[42px]">
            Search Jobs
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={transformJob(job)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search filters or check back later for new
            opportunities.
          </p>
        </div>
      )}
    </div>
  );
}
