import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface Company {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  company_website: string | null;
  company_industry: string;
  company_size: string;
  company_description: string | null;
  location: string;
  created_at: string;
}



export default function CompanyPage() {
  const { id } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        if (!id) return;

        const companyDocRef = doc(db, "profiles", id);
        const companyDoc = await getDoc(companyDocRef);

        if (companyDoc.exists() && companyDoc.data().role === "employer") {
          const companyData = companyDoc.data();
          setCompany({
            id: companyDoc.id,
            company_name: companyData.company_name || "",
            company_logo_url: companyData.company_logo_url || null,
            company_website: companyData.company_website || null,
            company_industry: companyData.company_industry || "",
            company_size: companyData.company_size || "",
            company_description: companyData.company_description || null,
            location: companyData.location || "",
            created_at: companyData.created_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompanyDetails();
    }
  }, [id]);

  // Format date helper function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


 

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-12 w-1/3 bg-muted rounded"></div>
          <div className="h-48 w-full bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Company Not Found</h1>
        <p className="text-gray-600">
          The company you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Company Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="h-24 w-24 rounded-lg border">
            <AvatarImage
              src={company.company_logo_url || undefined}
              alt={company.company_name}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl rounded-lg">
              {company.company_name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{company.company_name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
                  {company.company_industry && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{company.company_industry}</span>
                    </div>
                  )}
                  {company.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{company.location}</span>
                    </div>
                  )}
                  {company.company_size && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{company.company_size} employees</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {formatDate(company.created_at)}</span>
                  </div>
                </div>
              </div>

              {company.company_website && (
                <Button variant="outline" className="shrink-0" asChild>
                  <a
                    href={company.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Visit Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company Tabs */}
          <h2 className="text-2xl font-semibold mb-4">
            About {company.company_name}
          </h2>
          <div className="prose max-w-none">
            {company.company_description ? (
              <p className="text-gray-700">{company.company_description}</p>
            ) : (
              <p className="text-muted-foreground italic">
                No company description available.
              </p>
            )}
          </div>

          <Separator className="my-6" />

          <h3 className="text-xl font-semibold mb-4">Company Details</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Industry
              </dt>
              <dd className="mt-1">
                {company.company_industry || "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Company Size
              </dt>
              <dd className="mt-1">
                {company.company_size || "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Location
              </dt>
              <dd className="mt-1">{company.location || "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Website
              </dt>
              <dd className="mt-1">
                {company.company_website ? (
                  <a
                    href={company.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    {company.company_website}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  "Not specified"
                )}
              </dd>
            </div>
          </dl>
        
     
    </div>
  );
}
