import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  MapPinIcon,
  BriefcaseIcon,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Job categories
const jobCategories = [
  "Technology",
  "Design",
  "Marketing",
  "Sales",
  "Customer Service",
  "Finance",
  "Human Resources",
  "Engineering",
  "Education",
  "Healthcare",
  "Other",
];

// Job types
const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];

// Form schema with proper types
const formSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  location: z.string().min(1, "Location is required"),
  type: z.string(),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().min(1, "Requirements are required"),
  minSalary: z.string().optional(),
  maxSalary: z.string().optional(),
  currency: z.string(),
  isNegotiable: z.boolean(),
  skills: z.string(),
  minExperience: z.string().optional(),
  maxExperience: z.string().optional(),
  education: z.string().optional(),
  applicationDeadline: z.date().optional(),
  isRemote: z.boolean().default(false),
});

// Updated Job interface with proper types
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  description: string;
  requirements: string;
  status: string;
  isRemote: boolean;
  salary: {
    min: number | null;
    max: number | null;
    currency: string;
    isNegotiable: boolean;
  };
  skills: string[];
  experience: {
    min: number | null;
    max: number | null;
  };
  education: string | null;
  applicationDeadline: Date | null;
  applications: Array<Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  isFeatured: boolean;
}

export default function PostJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get("edit");
  const [isEditMode, setIsEditMode] = useState(Boolean(editJobId));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]); // Fix jobs state type
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      location: "",
      type: "Full-time",
      category: "",
      description: "",
      requirements: "",
      minSalary: "",
      maxSalary: "",
      currency: "USD",
      isNegotiable: false,
      skills: "",
      minExperience: "",
      maxExperience: "",
      education: "",
      isRemote: false,
    },
  });

  // Use useCallback to memoize the fetchJobs function to prevent infinite renders
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      // Create a query to get jobs where company ID matches user ID
      const jobsQuery = query(
        collection(db, "jobs"),
        where("company", "==", user?.id),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(jobsQuery);

      const jobsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        applicationDeadline: doc.data().applicationDeadline?.toDate() || null,
      })) as Job[]; // Type assertion to Job[]

      setJobs(jobsList);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      // Check if it's a missing index error and provide a more helpful message
      if (
        error instanceof Error &&
        error.message.includes("requires an index")
      ) {
        toast({
          title: "Firebase Index Required",
          description:
            "Please follow the link in the console to create the required index for this query.",
          variant: "destructive",
          duration: 10000, // Show for longer
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load your job listings.",
          variant: "destructive",
        });
      }

      // Set empty jobs array to prevent showing stale data
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user, db]); // Only recreate when user or db changes

  // Check if user is logged in and is an employer
  useEffect(() => {
    if (user && user.role === "employer") {
      fetchJobs();
    }
  }, [user, fetchJobs]);

  const handleDeleteJob = async (jobId: string) => {
    // Add type for jobId
    if (!confirm("Are you sure you want to delete this job posting?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "jobs", jobId));

      // Update local state
      setJobs(jobs.filter((job) => job.id !== jobId));

      toast({
        title: "Job Deleted",
        description: "The job posting has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({
        title: "Error",
        description: "Failed to delete the job posting.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    // Add types
    try {
      // Convert status to lowercase for consistency
      const normalizedStatus = newStatus.toLowerCase();

      await updateDoc(doc(db, "jobs", jobId), {
        status: normalizedStatus,
        updatedAt: new Date(),
      });

      // Update local state
      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: normalizedStatus } : job
        )
      );

      toast({
        title: "Status Updated",
        description: `The job status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating job status:", error);
      toast({
        title: "Error",
        description: "Failed to update the job status.",
        variant: "destructive",
      });
    }
  };

  const refreshJobList = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  // Effect to load job data when in edit mode
  useEffect(() => {
    const loadJobForEditing = async () => {
      if (editJobId && user) {
        try {
          setLoading(true);
          setIsEditMode(true);

          // Fetch the job document
          const jobDoc = await getDoc(doc(db, "jobs", editJobId));

          if (jobDoc.exists()) {
            const jobData = jobDoc.data();

            // Verify the job belongs to this employer
            if (jobData.company !== user.id) {
              toast({
                title: "Access Denied",
                description: "You don't have permission to edit this job.",
                variant: "destructive",
              });
              navigate("/post-job");
              return;
            }

            // Format the job data for the form
            form.reset({
              title: jobData.title || "",
              location: jobData.location || "",
              type: jobData.type || "Full-time",
              category: jobData.category || "",
              description: jobData.description || "",
              requirements: jobData.requirements || "",
              minSalary: jobData.salary?.min ? String(jobData.salary.min) : "",
              maxSalary: jobData.salary?.max ? String(jobData.salary.max) : "",
              currency: jobData.salary?.currency || "USD",
              isNegotiable: jobData.salary?.isNegotiable || false,
              skills: Array.isArray(jobData.skills)
                ? jobData.skills.join(", ")
                : "",
              minExperience: jobData.experience?.min
                ? String(jobData.experience.min)
                : "",
              maxExperience: jobData.experience?.max
                ? String(jobData.experience.max)
                : "",
              education: jobData.education || "",
              applicationDeadline:
                jobData.applicationDeadline?.toDate() || undefined,
              isRemote: jobData.isRemote || false,
            });

            // Scroll to top of the form
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            toast({
              title: "Job Not Found",
              description: "The job you're trying to edit could not be found.",
              variant: "destructive",
            });
            navigate("/post-job");
          }
        } catch (error) {
          console.error("Error fetching job for editing:", error);
          toast({
            title: "Error",
            description: "Failed to load job data for editing.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Reset form when not in edit mode
        form.reset({
          title: "",
          location: "",
          type: "Full-time",
          category: "",
          description: "",
          requirements: "",
          minSalary: "",
          maxSalary: "",
          currency: "USD",
          isNegotiable: false,
          skills: "",
          minExperience: "",
          maxExperience: "",
          education: "",
          isRemote: false,
        });
        setIsEditMode(false);
      }
    };

    loadJobForEditing();
  }, [editJobId, user, db, navigate, form]);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-500">You must be logged in to post a job.</p>
          <Button
            className="mt-4"
            onClick={() =>
              navigate("/login", { state: { returnUrl: "/post-job" } })
            }
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== "employer") {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-500">Only employers can post jobs.</p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      // Format form data for Firestore
      const jobData = {
        title: values.title,
        company: user?.id,
        location: values.location,
        type: values.type,
        category: values.category,
        description: values.description,
        requirements: values.requirements,
        salary: {
          min: values.minSalary ? parseInt(values.minSalary) : null,
          max: values.maxSalary ? parseInt(values.maxSalary) : null,
          currency: values.currency,
          isNegotiable: values.isNegotiable,
        },
        skills: values.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        experience: {
          min: values.minExperience ? parseInt(values.minExperience) : null,
          max: values.maxExperience ? parseInt(values.maxExperience) : null,
        },
        education: values.education || null,
        applicationDeadline: values.applicationDeadline || null,
        isRemote: values.isRemote,
        updatedAt: serverTimestamp(),
      };

      // If we're in edit mode, update the existing job
      if (isEditMode && editJobId) {
        // Get the current job data
        const jobRef = doc(db, "jobs", editJobId);
        const jobSnap = await getDoc(jobRef);

        if (!jobSnap.exists()) {
          throw new Error("Job not found");
        }

        // Keep existing values for these fields
        const updateData = {
          ...jobData,
          status: jobSnap.data().status, // Keep existing status
          applications: jobSnap.data().applications, // Keep existing applications
          views: jobSnap.data().views, // Keep existing views
          createdAt: jobSnap.data().createdAt, // Keep original creation date
        };

        // Update the job document
        await updateDoc(jobRef, updateData);

        toast({
          title: "Job Updated Successfully",
          description: "Your job listing has been updated.",
        });

        // Refresh the jobs list
        await fetchJobs();

        // Reset form and clear edit mode
        setIsEditMode(false);
        form.reset();

        // Remove the edit parameter from URL without navigation
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      } else {
        // Creating a new job
        const newJobData = {
          ...jobData,
          status: "open",
          isFeatured: false,
          applications: [],
          applicationsCount: 0,
          views: 0,
          createdAt: serverTimestamp(),
        };

        // Save to Firestore
        await addDoc(collection(db, "jobs"), newJobData);

        toast({
          title: "Job Posted Successfully",
          description: "Your job listing has been published.",
        });

        // Reset form
        form.reset();
      }

      // Refresh job list
      await fetchJobs();
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "posting"} job:`, error);
      toast({
        title: "Error",
        description: `Failed to ${
          isEditMode ? "update" : "post"
        } job. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Job Listings</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Post Job Form */}
        <div className="lg:w-7/12">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Job Listing" : "Post a New Job"}
            </h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Job Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Senior Frontend Developer"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Job Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. New York, NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Job Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Job Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remote Option */}
                <FormField
                  control={form.control}
                  name="isRemote"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Remote Position</FormLabel>
                        <p className="text-sm text-gray-500">
                          Check this if the position can be fully remote
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Job Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the job..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Job Requirements */}
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List the requirements for this position..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Min Salary */}
                  <FormField
                    control={form.control}
                    name="minSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 50000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Max Salary */}
                  <FormField
                    control={form.control}
                    name="maxSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 80000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Currency and Negotiable */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="CAD">CAD ($)</SelectItem>
                            <SelectItem value="AUD">AUD ($)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isNegotiable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-8">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Salary Negotiable</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Skills */}
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills (comma separated)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. JavaScript, React, Node.js"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Experience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Experience (years)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Experience (years)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 5"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Education */}
                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education Requirements</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Bachelor's Degree in Computer Science"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Application Deadline */}
                <FormField
                  control={form.control}
                  name="applicationDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Application Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Posting..."
                    : isEditMode
                    ? "Update Job"
                    : "Post Job"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Right Side - Job Listings */}
        <div className="lg:w-5/12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Job Listings</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshJobList}
                disabled={refreshing}
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-1", refreshing && "animate-spin")}
                />
                Refresh
              </Button>
            </div>

            {loading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="w-full">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">
                  You haven't posted any jobs yet.
                </p>
                <p className="text-sm">
                  Complete the form on the left to post your first job.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {jobs.map((job) => (
                  <Card key={job.id} className="w-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <CardDescription className="flex items-center text-xs">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {job.isRemote
                              ? `${job.location} (Remote)`
                              : job.location}
                          </CardDescription>
                        </div>
                        <div className="flex items-center">
                          <Badge
                            variant={
                              job.status === "open" || job.status === "Open"
                                ? "default"
                                : job.status === "closed" ||
                                  job.status === "Closed"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {job.status.charAt(0).toUpperCase() +
                              job.status.slice(1)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => navigate(`/jobs/${job.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/post-job?edit=${job.id}`)
                                }
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {job.status === "open" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateStatus(job.id, "closed")
                                  }
                                >
                                  Close Job
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateStatus(job.id, "open")
                                  }
                                >
                                  Reopen Job
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteJob(job.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center"
                        >
                          <BriefcaseIcon className="h-2 w-2 mr-1" />
                          {job.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {job.category}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {job.description}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-2 text-xs text-gray-500 flex justify-between">
                      <div>Posted: {job.createdAt.toLocaleDateString()}</div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{job.applications?.length || 0} applicants</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
