/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect} from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  where,
  query,
  getDocs,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Briefcase,
  Clock,
  Building2,
  CreditCard,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  Upload,
  File,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { uploadResume } from "@/lib/storage-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  isRemote: boolean;
  type: string;
  company: string; // company ID reference
  salary: {
    min: number | null;
    max: number | null;
    currency: string;
    isNegotiable: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  applicationDeadline: Date | null;
  requirements: string;
  skills: string[];
  status: string;
  category: string;
  views: number;
  applications: any[];
  companyData?: {
    id: string;
    name: string;
    logo?: string;
    industry?: string;
    location?: string;
    size?: string;
    website?: string;
    about?: string;
    founded?: number;
  };
}


export default function JobDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  // Resume upload states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        if (!id) return;

        // Get the job document
        const jobDocRef = doc(db, "jobs", id);
        const jobDoc = await getDoc(jobDocRef);

        if (jobDoc.exists()) {
          const jobData = jobDoc.data();

          // Get the company details from users collection (where employers are stored)
          const companyId = jobData.company;
          let companyData = null;

          if (companyId) {
            // First try the profiles collection (where employer accounts are stored)
            const profileDocRef = doc(db, "profiles", companyId);
            const profileDoc = await getDoc(profileDocRef);

            if (profileDoc.exists() && profileDoc.data().role === "employer") {
              companyData = profileDoc.data();
            } else {
              // Next try the companies collection (where dedicated company records are stored)
              const companyDocRef = doc(db, "companies", companyId);
              const companyDoc = await getDoc(companyDocRef);

              if (companyDoc.exists()) {
                companyData = companyDoc.data();
              }
            }
          }

          // Construct job object with company data
          const formattedJob: Job = {
            id: jobDoc.id,
            title: jobData.title || "",
            description: jobData.description || "",
            location: jobData.location || "",
            isRemote: jobData.isRemote || false,
            type: jobData.type || "Full-time",
            company: jobData.company || "",
            salary: {
              min: jobData.salary?.min || null,
              max: jobData.salary?.max || null,
              currency: jobData.salary?.currency || "USD",
              isNegotiable: jobData.salary?.isNegotiable || false,
            },
            createdAt: jobData.createdAt?.toDate() || new Date(),
            updatedAt: jobData.updatedAt?.toDate() || new Date(),
            applicationDeadline: jobData.applicationDeadline?.toDate() || null,
            requirements: jobData.requirements || "",
            skills: jobData.skills || [],
            status: jobData.status || "Open",
            category: jobData.category || "",
            views: jobData.views || 0,
            applications: jobData.applications || [],
            companyData: companyData
              ? {
                  id: companyData.id,
                  name:
                    companyData.company_name ||
                    companyData.name ||
                    "Unknown Company",
                  logo: companyData.company_logo_url || companyData.logo,
                  industry: companyData.industry,
                  location: companyData.location,
                  size: companyData.size,
                  website: companyData.website,
                  about: companyData.about,
                  founded: companyData.founded,
                }
              : undefined,
          };

          setJob(formattedJob);

          // Increment view count
          try {
            await updateDoc(jobDocRef, {
              views: increment(1),
            });
          } catch (error) {
            console.error("Error incrementing view count:", error);
          }
        }

        // Check if user has already applied for this job
        if (user && user.role === "jobseeker") {
          const applicationsQuery = query(
            collection(db, "job_applications"),
            where("job_id", "==", id),
            where("applicant_id", "==", user.id)
          );

          const applications = await getDocs(applicationsQuery);
          setHasApplied(!applications.empty);
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
        toast({
          title: "Error",
          description: "Failed to load job details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id, user]);

  

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type (pdf, doc, docx)
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, or DOCX file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        toast({
          title: "File too large",
          description: "Resume file must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setResumeFile(selectedFile);
    }
  };

  // Handle resume upload
  const handleResumeUpload = async () => {
    if (!resumeFile || !user) {
      toast({
        title: "No file selected",
        description: "Please select a resume file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Upload the file to Firebase Storage using the correct function
      const url = await uploadResume(resumeFile, user.id);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (url) {
        setResumeUrl(url);
        toast({
          title: "Resume uploaded",
          description: "Your resume has been uploaded successfully",
        });
      } else {
        throw new Error("Failed to upload resume");
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle apply with resume
  const handleApplyWithResume = async () => {
    try {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to apply for this job",
          variant: "destructive",
        });
        return;
      }

      if (user.role !== "jobseeker") {
        toast({
          title: "Not allowed",
          description: "Only job seekers can apply for jobs",
          variant: "destructive",
        });
        return;
      }

      if (!job) {
        toast({
          title: "Error",
          description: "Job details not found",
          variant: "destructive",
        });
        return;
      }

      if (!resumeUrl) {
        toast({
          title: "Resume required",
          description: "Please upload your resume before applying",
          variant: "destructive",
        });
        return;
      }

      setApplying(true);

      // Create application record in Firestore
      const applicationData = {
        job_id: job.id,
        job_title: job.title,
        company_id: job.company,
        company_name: job.companyData?.name || "Company",
        applicant_id: user.id,
        applicant_name: user.name || "",
        applicant_email: user.email,
        resume_url: resumeUrl,
        cover_letter: coverLetter,
        // Add applicant details (we already know it's a jobseeker at this point)
        applicant_type: "jobseeker",
        // Keep existing jobseeker profile as is
        status: "new", // Set initial status to 'new'
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      // Add application to job_applications collection
      const docRef = await addDoc(
        collection(db, "job_applications"),
        applicationData
      );

      console.log("Application submitted successfully with ID:", docRef.id);

      // Update job applications array and count
      try {
        const jobRef = doc(db, "jobs", job.id);
        await updateDoc(jobRef, {
          applications: arrayUnion(docRef.id), // Add application ID to array
          applicationsCount: increment(1), // Increment the counter
        });
      } catch (error) {
        console.error("Error updating job applications:", error);
        // Continue even if this part fails
      }

      // Reset state
      setShowApplyDialog(false);
      setHasApplied(true);
      setResumeUrl(null);
      setResumeFile(null);
      setCoverLetter("");

      toast({
        title: "Application submitted",
        description: "Your job application has been submitted successfully!",
      });
    } catch (error) {
      console.error("Error applying for job:", error);
      toast({
        title: "Application failed",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  // Format salary helper function
  const formatSalary = (
    min: number | null,
    max: number | null,
    currency: string,
    negotiable: boolean
  ) => {
    let salaryText = "Not disclosed";

    if (min && max) {
      salaryText = `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    } else if (min) {
      salaryText = `${currency} ${min.toLocaleString()}+`;
    } else if (max) {
      salaryText = `Up to ${currency} ${max.toLocaleString()}`;
    }

    if (negotiable) {
      salaryText += " (Negotiable)";
    }

    return salaryText;
  };

  // Is deadline passed helper function
  const isDeadlinePassed = (deadline: Date | null) => {
    if (!deadline) return false;
    const today = new Date();
    return deadline < today;
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

  if (!job) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Job Not Found</h1>
        <p className="text-gray-600">
          The job listing you are looking for does not exist or has been
          removed.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/jobs">Browse All Jobs</Link>
        </Button>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(job.applicationDeadline);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - job details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            {/* Job header info */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <Link
                      to={`/company/${job.company}`}
                      className="hover:text-primary"
                    >
                      {job.companyData?.name || "Company"}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.isRemote ? "Remote" : job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{job.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Posted {job.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <Badge variant={job.isRemote ? "outline" : "secondary"}>
                  {job.isRemote ? "Remote" : "On-site"}
                </Badge>
              </div>
            </div>

            {/* Application Deadline Alert */}
            {job.applicationDeadline && (
              <div
                className={`mt-6 p-3 rounded-md ${
                  deadlinePassed
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                } flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  <span>
                    {deadlinePassed
                      ? "Application deadline has passed"
                      : `Apply by ${job.applicationDeadline.toLocaleDateString()}`}
                  </span>
                </div>
                {deadlinePassed ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
            )}

            <Separator className="my-6" />

            {/* Job description */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <div className="whitespace-pre-wrap text-gray-700">
                {job.description}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <div className="whitespace-pre-wrap text-gray-700">
                {job.requirements}
              </div>
            </div>

            {/* Skills section */}
            {job.skills && job.skills.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h2 className="text-xl font-semibold mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar - job actions & company info */}
        <div>
          {/* Job Actions Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Job Details</h2>
            </div>

            <div className="space-y-4 mb-6">
              {/* Salary */}
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Salary</p>
                  <p className="font-medium">
                    {formatSalary(
                      job.salary?.min,
                      job.salary?.max,
                      job.salary?.currency || "USD",
                      job.salary?.isNegotiable || false
                    )}
                  </p>
                </div>
              </div>

              {/* Job type */}
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Job Type</p>
                  <p className="font-medium">{job.type}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="font-medium">
                    {job.isRemote ? "Remote" : job.location}
                  </p>
                </div>
              </div>

              {/* Posted date */}
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Posted Date
                  </p>
                  <p className="font-medium">
                    {job.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Application deadline */}
              {job.applicationDeadline && (
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Application Deadline
                    </p>
                    <p className="font-medium">
                      {job.applicationDeadline.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Total applications */}
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Applications
                  </p>
                  <p className="font-medium">{job.applications?.length || 0}</p>
                </div>
              </div>

              {/* Views count */}
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Views</p>
                  <p className="font-medium">{job.views || 0}</p>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-3">
              {user?.role === "employer" ? (
                <p className="text-sm text-center text-muted-foreground">
                  As an employer, you cannot apply for jobs.
                </p>
              ) : hasApplied ? (
                <Button className="w-full" variant="secondary" disabled>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Applied
                </Button>
              ) : (
                <Dialog
                  open={showApplyDialog}
                  onOpenChange={setShowApplyDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={deadlinePassed || !user}
                    >
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Apply to {job.title}</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                      {/* Resume Upload Section */}
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Upload Resume</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Please upload your resume (PDF, DOC, or DOCX format,
                          max 5MB)
                        </p>

                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-1">
                            <input
                              type="file"
                              id="resume"
                              className="hidden"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileChange}
                            />
                            <label
                              htmlFor="resume"
                              className="cursor-pointer flex items-center gap-2 p-2 border border-dashed rounded-md hover:bg-muted transition-colors"
                            >
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">
                                {resumeFile
                                  ? resumeFile.name
                                  : "Select resume file"}
                              </span>
                            </label>
                          </div>

                          <Button
                            onClick={handleResumeUpload}
                            disabled={!resumeFile || uploading}
                            size="sm"
                          >
                            {uploading ? "Uploading..." : "Upload"}
                          </Button>
                        </div>

                        {uploading && (
                          <div className="space-y-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-center text-muted-foreground">
                              Uploading: {uploadProgress}%
                            </p>
                          </div>
                        )}

                        {resumeUrl && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <File className="h-4 w-4" />
                            <span>Resume uploaded successfully</span>
                          </div>
                        )}
                      </div>

                      {/* Cover Letter Section (Optional) */}
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">
                          Cover Letter (Optional)
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add a cover letter to introduce yourself to the
                          employer
                        </p>

                        <textarea
                          className="w-full min-h-[120px] p-3 rounded-md border resize-y"
                          placeholder="Write a brief cover letter explaining why you're a good fit for this role..."
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowApplyDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleApplyWithResume}
                          disabled={applying || !resumeUrl}
                        >
                          {applying ? "Submitting..." : "Submit Application"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {deadlinePassed && (
                <p className="text-xs text-destructive mt-2 text-center">
                  Application deadline has passed
                </p>
              )}
              {!user && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  to apply for this job
                </p>
              )}
            </div>
          </div>

          {/* Company Info Card */}
          {job.companyData && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 rounded">
                  <AvatarImage
                    src={job.companyData.logo || undefined}
                    alt={job.companyData.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {job.companyData.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {job.companyData.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {job.companyData.industry || ""}
                  </p>
                </div>
              </div>

              {job.companyData.about && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {job.companyData.about}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {job.companyData.size && (
                  <Badge variant="outline">{job.companyData.size}</Badge>
                )}
                {job.companyData.location && (
                  <Badge variant="outline">{job.companyData.location}</Badge>
                )}
                {job.companyData.founded && (
                  <Badge variant="outline">
                    Founded {job.companyData.founded}
                  </Badge>
                )}
              </div>

              <Button className="w-full" variant="outline" asChild>
                <Link to={`/company/${job.company}`}>View Company Profile</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
