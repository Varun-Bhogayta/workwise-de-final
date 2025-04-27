import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

// Placeholder data - would come from your database in a real app
const mockJobs = [
  {
    id: "1",
    title: "Senior React Developer",
    location: "Remote",
    type: "Full-time",
    status: "active",
    applicants: 12,
    datePosted: "2025-04-10",
    expiryDate: "2025-05-10",
  },
  {
    id: "2",
    title: "UX/UI Designer",
    location: "New York",
    type: "Contract",
    status: "active",
    applicants: 7,
    datePosted: "2025-04-15",
    expiryDate: "2025-05-15",
  },
  {
    id: "3",
    title: "Product Manager",
    location: "Hybrid",
    type: "Full-time",
    status: "expired",
    applicants: 21,
    datePosted: "2025-03-01",
    expiryDate: "2025-04-01",
  },
  {
    id: "4",
    title: "DevOps Engineer",
    location: "San Francisco",
    type: "Full-time",
    status: "draft",
    applicants: 0,
    datePosted: "-",
    expiryDate: "-",
  },
];

export default function ManageJobsPage() {
  const [jobs] = useState(mockJobs);
  const navigate = useNavigate();

  // Filter tabs
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredJobs = jobs.filter((job) => {
    if (activeFilter === "all") return true;
    return job.status === activeFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Active
          </Badge>
        );
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "draft":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Draft
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Jobs</h1>
        <Button onClick={() => navigate("/dashboard/post-job")}>
          Post New Job
        </Button>
      </div>

      <div className="flex gap-4 mb-6 overflow-x-auto">
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          onClick={() => setActiveFilter("all")}
        >
          All Jobs
        </Button>
        <Button
          variant={activeFilter === "active" ? "default" : "outline"}
          onClick={() => setActiveFilter("active")}
        >
          Active
        </Button>
        <Button
          variant={activeFilter === "expired" ? "default" : "outline"}
          onClick={() => setActiveFilter("expired")}
        >
          Expired
        </Button>
        <Button
          variant={activeFilter === "draft" ? "default" : "outline"}
          onClick={() => setActiveFilter("draft")}
        >
          Drafts
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Your Job Listings</CardTitle>
          <CardDescription>
            Manage all your job posts and track applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.type}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() =>
                        navigate(`/dashboard/applicants?job=${job.id}`)
                      }
                    >
                      {job.applicants}
                    </Button>
                  </TableCell>
                  <TableCell>{job.datePosted}</TableCell>
                  <TableCell>{job.expiryDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/dashboard/post-job/${job.id}`)
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Job
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No jobs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
