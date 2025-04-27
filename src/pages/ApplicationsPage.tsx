import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  DocumentData,
  limit,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Eye, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Define interfaces for our data
interface JobApplication {
  id: string;
  job_id: string;
  job_title: string;
  company_id: string;
  company_name: string;
  company_logo?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  // Additional fields that might be in the application
  resume_url?: string;
  cover_letter?: string;
  job_type?: string;
  job_location?: string;
  job_status?: "open" | "closed"; // Add job status field
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Edit application state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<JobApplication | null>(null);
  const [newCoverLetter, setNewCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to handle opening the edit dialog
  const handleEditApplication = (application: JobApplication) => {
    setEditingApplication(application);
    setNewCoverLetter(application.cover_letter || "");
    setEditDialogOpen(true);
  };

  // Function to update an application
  const updateApplication = async () => {
    if (!editingApplication) return;

    try {
      setIsSubmitting(true);

      // Update application in Firestore
      const applicationRef = doc(db, "job_applications", editingApplication.id);
      await updateDoc(applicationRef, {
        cover_letter: newCoverLetter,
        updated_at: new Date(),
      });

      // Update local state
      setApplications(
        applications.map((app) =>
          app.id === editingApplication.id
            ? { ...app, cover_letter: newCoverLetter, updated_at: new Date() }
            : app
        )
      );

      toast({
        title: "Application updated",
        description: "Your application has been updated successfully.",
      });

      // Close dialog
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Error updating application",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Don't fetch if user is not logged in or not a jobseeker
    if (!user || user.role !== "jobseeker") return;

    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null); // Reset any previous errors

        // Create query for job_applications collection filtered by the current user's UID
        const applicationsQuery = query(
          collection(db, "job_applications"),
          where("applicant_id", "==", user.uid), // Changed from user.id to user.uid
          orderBy("created_at", "desc"),
          limit(50) // Limit to most recent 50 applications for performance
        );

        console.log(`Fetching applications for user UID: ${user.uid}`);
        const querySnapshot = await getDocs(applicationsQuery);

        console.log(`Found ${querySnapshot.size} applications`);

        if (querySnapshot.empty) {
          setApplications([]);
          setLoading(false);
          return;
        }

        const applicationData: JobApplication[] = [];

        // Process application documents and fetch additional job details
        const jobPromises = querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();

          try {
            // Get job details if job_id exists
            let jobDetails: DocumentData | null = null;
            let companyDetails: DocumentData | null = null;

            if (data.job_id) {
              const jobDoc = await getDoc(doc(db, "jobs", data.job_id));

              if (jobDoc.exists()) {
                jobDetails = jobDoc.data();
                console.log(`Job details for ${data.job_id}:`, jobDetails);

                // Get company details if available
                if (jobDetails.company_id) {
                  const companyDoc = await getDoc(
                    doc(db, "companies", jobDetails.company_id)
                  );
                  if (companyDoc.exists()) {
                    companyDetails = companyDoc.data();
                  }
                }
              }
            }

            // Format the application data
            applicationData.push({
              id: docSnapshot.id,
              job_id: data.job_id,
              job_title: data.job_title || "Untitled Position",
              company_id: data.company_id,
              company_name: data.company_name || "Unknown Company",
              company_logo: companyDetails?.logo || null,
              status: data.status || "submitted",
              // Handle Firestore timestamp conversion
              created_at: data.created_at?.toDate() || new Date(),
              updated_at: data.updated_at?.toDate() || new Date(),
              resume_url: data.resume_url,
              cover_letter: data.cover_letter,
              job_type: jobDetails?.type || null,
              job_location: jobDetails?.location || null,
              // Check different possible status field names
              job_status:
                jobDetails?.status ||
                jobDetails?.job_status ||
                jobDetails?.is_active === false
                  ? "closed"
                  : "open",
            });
          } catch (err) {
            console.error("Error processing application:", err, data);
          }
        });

        // Wait for all job data to be fetched
        await Promise.all(jobPromises);

        // Sort applications by created_at date (newest first)
        applicationData.sort(
          (a, b) => b.created_at.getTime() - a.created_at.getTime()
        );

        setApplications(applicationData);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setError("Failed to load your applications. Please try again later.");
        toast({
          title: "Error fetching applications",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  // Filter applications based on the active tab
  const filteredApplications = applications.filter((application) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") {
      return (
        application.job_status !== "closed" && // Don't show closed jobs in active tab
        ["submitted", "reviewed", "shortlisted", "interviewed"].includes(
          application.status
        )
      );
    }
    if (activeTab === "open") {
      return application.job_status !== "closed"; // Only show open jobs
    }
    if (activeTab === "pending")
      return ["submitted", "reviewed"].includes(application.status);
    if (activeTab === "shortlisted")
      return ["shortlisted", "interviewed", "offered"].includes(
        application.status
      );
    if (activeTab === "rejected") return application.status === "rejected";
    return true;
  });

  // Format the application date
  const formatApplicationDate = (date: Date) => {
    try {
      // Check if date is valid before formatting
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return "Recently";
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Recently";
    }
  };

  // Get badge for application status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="outline">Submitted</Badge>;
      case "reviewed":
        return <Badge variant="secondary">Reviewed</Badge>;
      case "shortlisted":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Shortlisted
          </Badge>
        );
      case "interviewed":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Interviewed
          </Badge>
        );
      case "offered":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Offered
          </Badge>
        );
      case "hired":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Hired
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Show message if user is not logged in or not a jobseeker
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">My Applications</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">
            Please sign in to view your applications
          </p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "jobseeker") {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">My Applications</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">
            This page is only available for job seekers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Applications</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All Applications
            <Badge variant="secondary" className="ml-2">
              {applications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">
              {
                applications.filter((a) =>
                  [
                    "submitted",
                    "reviewed",
                    "shortlisted",
                    "interviewed",
                  ].includes(a.status)
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="open">
            Open Jobs
            <Badge variant="secondary" className="ml-2">
              {applications.filter((a) => a.job_status !== "closed").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="shortlisted">
            Shortlisted
            <Badge variant="secondary" className="ml-2">
              {
                applications.filter((a) =>
                  ["shortlisted", "interviewed", "offered"].includes(a.status)
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            <Badge variant="secondary" className="ml-2">
              {applications.filter((a) => a.status === "rejected").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Application History</CardTitle>
              <CardDescription>
                Track the status of your job applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredApplications.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Position</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div className="font-medium">
                              {application.job_title}
                            </div>
                            {application.job_type &&
                              application.job_location && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {application.job_type} •{" "}
                                  {application.job_location}
                                </div>
                              )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {application.company_logo ? (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={application.company_logo}
                                    alt={application.company_name}
                                  />
                                  <AvatarFallback>
                                    {application.company_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : null}
                              {application.company_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(application.status)}
                          </TableCell>
                          <TableCell>
                            {formatApplicationDate(application.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/jobs/${application.job_id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleEditApplication(application)
                                }
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No applications found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't applied to any jobs yet or no applications match
                    your current filter.
                  </p>
                  <Button asChild>
                    <Link to="/jobs">Browse Jobs</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              {editingApplication && (
                <span>
                  Editing application for:{" "}
                  <strong>{editingApplication.job_title}</strong> at{" "}
                  <strong>{editingApplication.company_name}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea
                id="coverLetter"
                value={newCoverLetter}
                onChange={(e) => setNewCoverLetter(e.target.value)}
                placeholder="Write your cover letter here..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={updateApplication} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
