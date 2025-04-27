import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Building2, Users, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, where } from "firebase/firestore";

interface Company {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  company_industry: string;
  company_size: string;
  company_description: string | null;
  location: string;
  jobs_count: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    industry: "all",
    size: "all",
  });

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);

      // Start with base query
      let baseQuery = query(
        collection(db, "profiles"),
        where("role", "==", "employer")
      );

      // Add filters if they exist
      if (filters.industry && filters.industry !== "all") {
        baseQuery = query(
          baseQuery,
          where("company_industry", "==", filters.industry)
        );
      }

      if (filters.size && filters.size !== "all") {
        baseQuery = query(baseQuery, where("company_size", "==", filters.size));
      }

      const querySnapshot = await getDocs(baseQuery);

      let results = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          company_name: doc.data().company_name || "",
          company_logo_url: doc.data().company_logo_url || null,
          company_industry: doc.data().company_industry || "",
          company_size: doc.data().company_size || "",
          company_description:
            doc.data().company_description || doc.data().company_about || "",
          location: doc.data().location || "",
          jobs_count: doc.data().jobs_count || 0,
        }))
        .filter((company) => company.company_name);

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(
          (company) =>
            company.company_name.toLowerCase().includes(searchLower) ||
            company.company_description?.toLowerCase().includes(searchLower) ||
            company.company_industry.toLowerCase().includes(searchLower)
        );
      }

      setCompanies(results);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Companies</h1>
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search companies..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-9"
            />
          </div>

          <Select
            value={filters.industry}
            onValueChange={(value) =>
              setFilters({ ...filters, industry: value })
            }
          >
            <SelectTrigger>
              <Building2 className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.size}
            onValueChange={(value) => setFilters({ ...filters, size: value })}
          >
            <SelectTrigger>
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Company Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-500">201-500 employees</SelectItem>
              <SelectItem value="501-1000">501-1000 employees</SelectItem>
              <SelectItem value="1001+">1000+ employees</SelectItem>
            </SelectContent>
          </Select>

          <Button type="submit" className="md:col-span-3">
            Search Companies
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-muted"></div>
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
      ) : companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Link
              key={company.id}
              to={`/company/${company.id}`}
              className="block group"
            >
              <div className="border rounded-lg p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 rounded-lg">
                    <AvatarImage
                      src={company.company_logo_url || undefined}
                      alt={company.company_name}
                    />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg">
                      {company.company_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {company.company_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {company.location}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Building2 className="h-4 w-4" />
                    <span>{company.company_industry}</span>
                    <span className="mx-2">•</span>
                    <Users className="h-4 w-4" />
                    <span>{company.company_size}</span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {company.company_description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Briefcase className="h-3 w-3" />
                      {company.jobs_count || 0} open positions
                    </Badge>
                    <span className="text-sm text-primary font-medium group-hover:underline">
                      View Company
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No companies found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search filters or check back later.
          </p>
        </div>
      )}
    </div>
  );
}
