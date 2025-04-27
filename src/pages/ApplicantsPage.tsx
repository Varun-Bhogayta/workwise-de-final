import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Eye,
  UserCheck,
  Download,
  Calendar,
  Clock,
  Building,
  PhoneCall,
  User,
  Briefcase,
  Check,
  X,
  ChevronDown,
  Edit,
  AlertCircle,
} from "lucide-react";

// Add status type
type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interviewing"
  | "hired"
  | "rejected";

interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  resume_url?: string;
  cover_letter?: string;
  created_at: Date;
}

interface Applicant {
  id: string;
  full_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  experience?: string;
  education?: string;
  skills?: string[];
}

interface Job {
  id: string;
  title: string;
  company_name?: string;
  location?: string;
  status?: "open" | "closed";
  created_at?: Date;
  description?: string;
  applicationsCount?: number; // Add this field
}

export default function ApplicantsPage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "all" | "new" | "shortlisted" | "rejected"
  >("all");
  const [selectedJob, setSelectedJob] = useState<string | null>(
    searchParams.get("job")
  );
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [editJobDialogOpen, setEditJobDialogOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);

  // Wrap fetchJobApplications in useCallback
  const fetchJobApplications = useCallback(
    async (jobId?: string) => {
      const targetJobId = jobId || selectedJob;
      if (!user || !targetJobId) return;

      try {
        setLoading(true);

        const applicationsQuery = query(
          collection(db, "job_applications"),
          where("job_id", "==", targetJobId)
        );

        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applicationsList = applicationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || new Date(),
        })) as JobApplication[];

        setJobApplications(applicationsList);

        // Fetch applicant details for each application
        const applicantIds = applicationsList.map((app) => app.applicant_id);
        await fetchApplicantDetails(applicantIds);
      } catch (error) {
        console.error("Error fetching job applications:", error);
      } finally {
        setLoading(false);
      }
    },
    [user, selectedJob]
  ); // Only depend on user and selectedJob

  // Split the effects to avoid circular dependencies
  useEffect(() => {
    if (selectedJob) {
      setSearchParams({ job: selectedJob });
    } else {
      setSearchParams({});
    }
  }, [selectedJob, setSearchParams]);

  // Separate effect for initial job loading
  useEffect(() => {
    const fetchEmployerJobs = async () => {
      if (!user || user.role !== "employer") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const jobsQuery = query(
          collection(db, "jobs"),
          where("company", "==", user.id)
        );

        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsList = jobsSnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          company_name: doc.data().company_name,
          location: doc.data().location,
          status: doc.data().status,
          created_at: doc.data().created_at?.toDate(),
          description: doc.data().description,
          applicationsCount: doc.data().applicationsCount, // Add this field
        }));

        setJobs(jobsList);

        // Only set selected job and fetch applications if we don't have a selected job
        if (jobsList.length > 0 && !selectedJob) {
          const jobId = searchParams.get("job") || jobsList[0].id;
          setSelectedJob(jobId);
        }
      } catch (error) {
        console.error("Error fetching employer jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployerJobs();
  }, [user, searchParams, selectedJob]); // Include selectedJob in dependencies

  // Separate effect for fetching applications when selectedJob changes
  useEffect(() => {
    if (selectedJob) {
      fetchJobApplications(selectedJob);
    }
  }, [selectedJob, fetchJobApplications]);

  const fetchApplicantDetails = async (applicantIds: string[]) => {
    if (!applicantIds.length) return;

    const uniqueIds = [...new Set(applicantIds)];
    const newApplicants: Applicant[] = [];

    await Promise.all(
      uniqueIds.map(async (applicantId) => {
        try {
          const applicantDoc = await getDoc(doc(db, "profiles", applicantId));
          if (applicantDoc.exists()) {
            const data = applicantDoc.data();
            newApplicants.push({
              id: applicantId,
              full_name: data.full_name,
              email: data.email,
              phone: data.phone,
              avatar_url: data.avatar_url,
              experience: data.experience,
              education: data.education,
              skills: data.skills,
            });
          }
        } catch (error) {
          console.error(`Error fetching applicant ${applicantId}:`, error);
        }
      })
    );

    setApplicants(newApplicants);
  };

  const handleSendEmail = (applicant: Applicant) => {
    if (!applicant?.email) return;

    const jobTitle =
      jobs.find((j) => j.id === selectedJob)?.title || "Job Position";
    const mailtoSubject = `Re: Application for ${jobTitle}`;
    const mailtoBody = `Dear ${
      applicant.full_name || "Applicant"
    },\n\nThank you for your application for the ${jobTitle} position.\n\nBest regards,\n${
      user?.name || "Hiring Manager"
    }`;

    const mailtoLink = `mailto:${applicant.email}?subject=${encodeURIComponent(
      mailtoSubject
    )}&body=${encodeURIComponent(mailtoBody)}`;
    window.location.href = mailtoLink;
  };

  // Update setJobToEdit calls to use proper typing
  const handleJobEdit = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setJobToEdit((prev) =>
      prev
        ? {
            ...prev,
            [name]: value,
          }
        : null
    );
  };

  // Function to simulate loading when changing jobs
  const handleJobSelect = (jobId: string) => {
    setLoading(true);
    setSelectedJob(jobId);
    setSelectedApplicant(null);
    fetchJobApplications(jobId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">New</Badge>;
      case "reviewing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Reviewing
          </Badge>
        );
      case "shortlisted":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Shortlisted
          </Badge>
        );
      case "interviewing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            Interviewing
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    try {
      // Check if the date string is valid
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Recently";
      }

      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Recently"; // Return a fallback value if there's an error
    }
  };

  // Helper function to find application details for an applicant
  const getApplicationForApplicant = (
    applicantId: string
  ): JobApplication | undefined => {
    return jobApplications.find((app) => app.applicant_id === applicantId);
  };

  // Function to update application status
  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    try {
      setLoading(true);

      // Get application document reference
      const applicationRef = doc(db, "job_applications", applicationId);

      // Update the status and add updated_at timestamp
      await updateDoc(applicationRef, {
        status: newStatus,
        updated_at: serverTimestamp(),
      });

      // Update local state
      setJobApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      // Show success message
      toast({
        title: "Status updated",
        description: `Application status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Update failed",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to save job edits
  const saveJobEdits = async () => {
    if (!jobToEdit) return;

    try {
      setLoading(true);

      // Get job document reference
      const jobRef = doc(db, "jobs", jobToEdit.id);

      // Update the job details
      await updateDoc(jobRef, {
        title: jobToEdit.title,
        location: jobToEdit.location,
        description: jobToEdit.description,
        updated_at: serverTimestamp(),
      });

      // Update local state
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobToEdit.id ? { ...job, ...jobToEdit } : job
        )
      );

      // Show success message
      toast({
        title: "Job updated",
        description: "Job details have been updated successfully.",
      });

      setEditJobDialogOpen(false);
    } catch (error) {
      console.error("Error updating job details:", error);
      toast({
        title: "Update failed",
        description: "Failed to update job details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle job status (open/closed)
  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    try {
      setLoading(true);

      // Get job document reference
      const jobRef = doc(db, "jobs", jobId);

      // New status is the opposite of the current status (ensure lowercase for consistency)
      const newStatus = currentStatus === "closed" ? "open" : "closed";

      // Update the job status
      await updateDoc(jobRef, {
        status: newStatus,
        updated_at: serverTimestamp(),
      });

      // Update local state
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );

      // Show success message
      toast({
        title: "Job status updated",
        description: `Job is now ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating job status:", error);
      toast({
        title: "Update failed",
        description: "Failed to update job status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update tabs to properly type the onValueChange handler
  const handleTabChange = (value: string) => {
    if (
      value === "all" ||
      value === "new" ||
      value === "shortlisted" ||
      value === "rejected"
    ) {
      setActiveTab(value);
    }
  };

  // Update application actions to handle undefined cases
  const handleApplicationAction = (
    application: JobApplication | undefined,
    newStatus: ApplicationStatus
  ) => {
    if (!application) return;
    updateApplicationStatus(application.id, newStatus);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Manage Applicants</h1>

      {user?.role !== "employer" ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-1">Employer Access Only</h3>
            <p className="text-muted-foreground text-sm text-center">
              This page is only accessible to employer accounts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Job list */}
          <div className="w-full lg:w-1/3">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Posted Jobs</CardTitle>
                <CardDescription>
                  Select a job to view its applicants
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {loading && !jobs.length ? (
                    // Loading skeleton for jobs
                    Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <div key={index} className="p-4">
                          <div className="flex justify-between items-start mb-1">
                            <Skeleton className="h-5 w-3/4" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-5 w-16" />
                              <Skeleton className="h-5 w-20" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-1/2 mb-2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      ))
                  ) : jobs.length > 0 ? (
                    jobs.map((job) => (
                      <div
                        key={job.id}
                        className={`p-4 hover:bg-muted cursor-pointer transition-colors ${
                          selectedJob === job.id ? "bg-muted" : ""
                        }`}
                        onClick={() => handleJobSelect(job.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium">{job.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                job.status === "closed"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {job.status === "closed" ? "Closed" : "Open"}
                            </Badge>
                            <Badge variant="outline">
                              {job.applicationsCount ||
                                jobApplications.filter(
                                  (app) => app.job_id === job.id
                                ).length}{" "}
                              {(job.applicationsCount ||
                                jobApplications.filter(
                                  (app) => app.job_id === job.id
                                ).length) === 1
                                ? "applicant"
                                : "applicants"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center mb-1">
                          <Building className="h-3 w-3 mr-1 inline-block" />
                          {job.company_name || "Your Company"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center justify-between">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 inline-block" />
                            Posted{" "}
                            {formatDate(
                              job.created_at?.toISOString() ||
                                new Date().toISOString()
                            )}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleJobStatus(job.id, job.status || "open");
                              }}
                            >
                              {job.status === "closed" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/post-job?edit=${job.id}`);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No jobs posted yet</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => (window.location.href = "/post-job")}
                      >
                        Post your first job
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Applicants for selected job */}
          <div className="w-full lg:w-2/3">
            {selectedJob && (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold mb-2">
                    {jobs.find((j) => j.id === selectedJob)?.title || "Job"}
                  </h2>
                  <p className="text-muted-foreground">
                    {jobs.find((j) => j.id === selectedJob)?.company_name ||
                      "Your Company"}{" "}
                    •{" "}
                    {jobs.find((j) => j.id === selectedJob)?.location ||
                      "Location"}
                  </p>
                </div>

                <Tabs
                  defaultValue="all"
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full mb-6"
                >
                  <TabsList>
                    <TabsTrigger value="all">
                      All
                      <Badge variant="secondary" className="ml-2">
                        {jobApplications.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="new">
                      New
                      <Badge variant="secondary" className="ml-2">
                        {
                          jobApplications.filter((app) => app.status === "new")
                            .length
                        }
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="shortlisted">
                      Shortlisted
                      <Badge variant="secondary" className="ml-2">
                        {
                          jobApplications.filter((app) =>
                            ["shortlisted", "interviewing"].includes(
                              app.status || ""
                            )
                          ).length
                        }
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected
                      <Badge variant="secondary" className="ml-2">
                        {
                          jobApplications.filter(
                            (app) => app.status === "rejected"
                          ).length
                        }
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-4">
                    {loading ? (
                      // Loading skeleton
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <Card key={i} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-[200px]" />
                                  <Skeleton className="h-4 w-[160px]" />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Skeleton className="h-9 w-full" />
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : applicants.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {applicants
                          .filter((applicant) => {
                            // Get the application for this applicant
                            const application = getApplicationForApplicant(
                              applicant.id
                            );
                            if (!application) return false;

                            // Filter by status based on active tab
                            if (activeTab === "all") return true;
                            if (activeTab === "shortlisted")
                              return ["shortlisted", "interviewing"].includes(
                                application.status || ""
                              );
                            if (activeTab === "rejected")
                              return application.status === "rejected";

                            return true;
                          })
                          .map((applicant) => {
                            const application = getApplicationForApplicant(
                              applicant.id
                            );
                            return (
                              <Card
                                key={applicant.id}
                                className={`overflow-hidden ${
                                  selectedApplicant === applicant.id
                                    ? "border-primary"
                                    : ""
                                }`}
                              >
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between">
                                    <div className="flex items-center space-x-4">
                                      <Avatar className="h-12 w-12">
                                        <AvatarImage
                                          src={applicant.avatar_url}
                                        />
                                        <AvatarFallback>
                                          {getInitials(
                                            applicant.full_name || "User"
                                          )}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h3 className="font-medium">
                                          {applicant.full_name || "Applicant"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                          {applicant.experience ||
                                            "Not specified"}{" "}
                                          experience
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      {getStatusBadge(
                                        application?.status || "new"
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center">
                                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>{applicant.email}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <PhoneCall className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>
                                        {applicant.phone || "Not provided"}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>
                                        Applied on{" "}
                                        {formatDate(
                                          application?.created_at.toISOString() ||
                                            new Date().toISOString()
                                        )}
                                      </span>
                                    </div>

                                    <div className="pt-2">
                                      <h4 className="text-xs font-medium uppercase text-muted-foreground mb-1">
                                        Skills
                                      </h4>
                                      <div className="flex flex-wrap gap-1">
                                        {(
                                          applicant.skills || ["Not specified"]
                                        ).map(
                                          (skill: string, index: number) => (
                                            <Badge
                                              key={index}
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {skill}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex justify-between pt-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setSelectedApplicant(applicant.id)
                                    }
                                    className="flex-1 mr-1"
                                  >
                                    <Eye className="h-4 w-4 mr-1" /> View
                                    Details
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        Actions{" "}
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {application?.resume_url && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            window.open(
                                              application.resume_url,
                                              "_blank"
                                            )
                                          }
                                        >
                                          <FileText className="mr-2 h-4 w-4" />
                                          View Resume
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleSendEmail(applicant)
                                        }
                                      >
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Email
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel>
                                        Change Status
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleApplicationAction(
                                            application,
                                            "reviewing"
                                          )
                                        }
                                      >
                                        <Clock className="mr-2 h-4 w-4" />
                                        Set to Reviewing
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleApplicationAction(
                                            application,
                                            "shortlisted"
                                          )
                                        }
                                      >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Shortlist
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleApplicationAction(
                                            application,
                                            "interviewing"
                                          )
                                        }
                                      >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Schedule Interview
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleApplicationAction(
                                            application,
                                            "hired"
                                          )
                                        }
                                      >
                                        <Check className="mr-2 h-4 w-4" />
                                        Mark as Hired
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() =>
                                          handleApplicationAction(
                                            application,
                                            "rejected"
                                          )
                                        }
                                      >
                                        <X className="mr-2 h-4 w-4" />
                                        Reject
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </CardFooter>
                              </Card>
                            );
                          })}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="font-medium text-lg mb-1">
                            No applicants found
                          </h3>
                          <p className="text-muted-foreground text-sm text-center">
                            There are no applicants for this job posting that
                            match your filter criteria.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Applicant Details Panel - Shows when an applicant is selected */}
                {selectedApplicant &&
                  (() => {
                    const applicant = applicants.find(
                      (a) => a.id === selectedApplicant
                    );
                    const application = applicant
                      ? getApplicationForApplicant(applicant.id)
                      : null;

                    if (!applicant || !application) return null;

                    return (
                      <Card className="mt-4 border-primary">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle>Applicant Details</CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedApplicant(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={applicant.avatar_url} />
                                <AvatarFallback>
                                  {getInitials(applicant.full_name || "User")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h2 className="text-xl font-semibold">
                                  {applicant.full_name || "Applicant"}
                                </h2>
                                <p className="text-muted-foreground">
                                  {applicant.experience || "Not specified"}{" "}
                                  experience
                                </p>
                                <div className="flex items-center mt-1">
                                  {getStatusBadge(application.status || "new")}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h3 className="text-sm font-medium mb-2">
                                  Contact Information
                                </h3>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{applicant.email}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <PhoneCall className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>
                                      {applicant.phone || "Not provided"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-medium mb-2">
                                  Application Details
                                </h3>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>
                                      Applied on{" "}
                                      {formatDate(
                                        application.created_at.toISOString() ||
                                          new Date().toISOString()
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>
                                      {jobs.find((j) => j.id === selectedJob)
                                        ?.title || "Job Position"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {applicant.education && (
                              <div>
                                <h3 className="text-sm font-medium mb-2">
                                  Education
                                </h3>
                                <p>{applicant.education}</p>
                              </div>
                            )}

                            {applicant.skills &&
                              applicant.skills.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-medium mb-2">
                                    Skills
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
                                    {applicant.skills.map(
                                      (skill: string, index: number) => (
                                        <Badge key={index} variant="secondary">
                                          {skill}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {application.cover_letter && (
                              <div>
                                <h3 className="text-sm font-medium mb-2">
                                  Cover Letter
                                </h3>
                                <Card className="bg-muted/50">
                                  <CardContent className="p-4 text-sm">
                                    <p>{application.cover_letter}</p>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-4">
                          {application.resume_url && (
                            <Button
                              variant="outline"
                              className="flex-1 mr-2"
                              onClick={() =>
                                window.open(application.resume_url, "_blank")
                              }
                            >
                              <Download className="mr-2 h-4 w-4" /> View Resume
                            </Button>
                          )}
                          <div className="flex space-x-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                updateApplicationStatus(
                                  application.id,
                                  "rejected"
                                )
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateApplicationStatus(
                                  application.id,
                                  "shortlisted"
                                )
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Shortlist
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Job Dialog */}
      <Dialog open={editJobDialogOpen} onOpenChange={setEditJobDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>
              Update the details of the job posting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                name="title"
                value={jobToEdit?.title || ""}
                onChange={handleJobEdit}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={jobToEdit?.location || ""}
                onChange={handleJobEdit}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={jobToEdit?.description || ""}
                onChange={handleJobEdit}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditJobDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveJobEdits}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
