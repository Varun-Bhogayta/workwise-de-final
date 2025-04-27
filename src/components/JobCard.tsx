import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Building, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface JobCardProps {
  job: {
    _id: string;
    title: string;
    company: {
      _id: string;
      name: string;
      logo?: string;
    };
    location: string;
    type: string; // 'full-time', 'part-time', etc.
    salary?: {
      min: number;
      max: number;
      currency: string;
    };
    postedAt: any; // Changed from string to any to handle Firebase Timestamp objects
    skills?: string[];
    featured?: boolean;
  };
}

const JobCard = ({ job }: JobCardProps) => {
  // Safely parse the date with error handling
  const getPostedTime = () => {
    try {
      // Check if postedAt is a Firebase Timestamp (contains seconds and nanoseconds)
      if (
        job.postedAt &&
        typeof job.postedAt === "object" &&
        "seconds" in job.postedAt
      ) {
        // Convert Firebase Timestamp to Date
        return formatDistanceToNow(new Date(job.postedAt.seconds * 1000), {
          addSuffix: true,
        });
      }

      // Handle ISO string date format
      if (
        job.postedAt &&
        typeof job.postedAt === "string" &&
        job.postedAt.trim() !== ""
      ) {
        return formatDistanceToNow(new Date(job.postedAt), { addSuffix: true });
      }

      // Fallback for other cases
      return "recently";
    } catch (error) {
      console.error("Error parsing date:", error, job.postedAt);
      return "recently"; // Fallback text if date parsing fails
    }
  };

  const postedTime = getPostedTime();

  // Helper function to safely format salary numbers
  const formatSalary = (value: any): string => {
    if (value === undefined || value === null) return "N/A";
    if (typeof value === "number") return value.toLocaleString();
    // Handle the case where value might be a string
    if (typeof value === "string") {
      const num = parseFloat(value);
      return isNaN(num) ? value : num.toLocaleString();
    }
    return String(value);
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        job.featured ? "border-primary/50" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-start gap-4 p-4">
        <Avatar className="h-14 w-14 rounded-md">
          <AvatarImage src={job.company.logo} alt={job.company.name} />
          <AvatarFallback className="rounded-md bg-primary/10 text-primary">
            {job.company.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <Link
              to={`/jobs/${job._id}`}
              className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
            >
              {job.title}
            </Link>
            {job.featured && (
              <Badge variant="outline" className="border-primary text-primary">
                Featured
              </Badge>
            )}
          </div>
          <Link
            to={`/company/${job.company._id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
          >
            <Building className="h-3 w-3 mr-1" />
            {job.company.name}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 grid gap-2">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{job.type}</span>
          </div>
          {job.salary && (
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              <span>
                {job.salary.currency || "$"} {formatSalary(job.salary.min)} -{" "}
                {formatSalary(job.salary.max)}
              </span>
            </div>
          )}
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {job.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{job.skills.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 pt-0 border-t border-border mt-3">
        <div className="text-xs text-muted-foreground">Posted {postedTime}</div>
        <Button asChild size="sm">
          <Link to={`/jobs/${job._id}`}>View Job</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;
