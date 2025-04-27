import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, EyeIcon, EyeOffIcon, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/AuthContext";

const jobSeekerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const employerSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    industry: z.string().min(1, "Please select an industry"),
    size: z.string().min(1, "Please select a company size"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type JobSeekerFormValues = z.infer<typeof jobSeekerSchema>;
type EmployerFormValues = z.infer<typeof employerSchema>;

const RegisterPage = () => {
  const { register, loginWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"jobseeker" | "employer">(
    "jobseeker"
  );
  const [jobSeekerShowPassword, setJobSeekerShowPassword] = useState(false);
  const [jobSeekerShowConfirmPassword, setJobSeekerShowConfirmPassword] =
    useState(false);
  const [employerShowPassword, setEmployerShowPassword] = useState(false);
  const [employerShowConfirmPassword, setEmployerShowConfirmPassword] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobSeekerForm = useForm<JobSeekerFormValues>({
    resolver: zodResolver(jobSeekerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const employerForm = useForm<EmployerFormValues>({
    resolver: zodResolver(employerSchema),
    defaultValues: {
      companyName: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      industry: "",
      size: "",
    },
  });

  const onJobSeekerSubmit = async (data: JobSeekerFormValues) => {
    try {
      setIsSubmitting(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _confirmPassword, ...userData } = data;

      await register({
        ...userData,
        role: "jobseeker",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmployerSubmit = async (data: EmployerFormValues) => {
    try {
      setIsSubmitting(true);
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        confirmPassword: _confirmPassword,
        companyName,
        industry,
        size,
        ...userData
      } = data;

      await register({
        ...userData,
        role: "employer",
        companyName,
        industry,
        size,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Briefcase className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Create your account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join WorkWise to find your next opportunity
          </p>
        </div>

        {/* Google Sign-in Button */}
        <div>
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3"
            onClick={handleGoogleSignIn}
            disabled={loading || isSubmitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="24"
              height="24"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Sign up with Google
          </Button>

          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">
                OR CONTINUE WITH EMAIL
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Tabs
          defaultValue="jobseeker"
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "jobseeker" | "employer")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jobseeker" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Job Seeker
            </TabsTrigger>
            <TabsTrigger value="employer" className="flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Employer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobseeker">
            <Form {...jobSeekerForm}>
              <form
                onSubmit={jobSeekerForm.handleSubmit(onJobSeekerSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={jobSeekerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          autoComplete="name"
                          disabled={loading || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={jobSeekerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@example.com"
                          type="email"
                          autoComplete="email"
                          disabled={loading || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={jobSeekerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={jobSeekerShowPassword ? "text" : "password"}
                            autoComplete="new-password"
                            disabled={loading || isSubmitting}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() =>
                              setJobSeekerShowPassword(!jobSeekerShowPassword)
                            }
                          >
                            {jobSeekerShowPassword ? (
                              <EyeOffIcon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <EyeIcon className="h-4 w-4" aria-hidden="true" />
                            )}
                            <span className="sr-only">
                              {jobSeekerShowPassword
                                ? "Hide password"
                                : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={jobSeekerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={
                              jobSeekerShowConfirmPassword ? "text" : "password"
                            }
                            autoComplete="new-password"
                            disabled={loading || isSubmitting}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() =>
                              setJobSeekerShowConfirmPassword(
                                !jobSeekerShowConfirmPassword
                              )
                            }
                          >
                            {jobSeekerShowConfirmPassword ? (
                              <EyeOffIcon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <EyeIcon className="h-4 w-4" aria-hidden="true" />
                            )}
                            <span className="sr-only">
                              {jobSeekerShowConfirmPassword
                                ? "Hide password"
                                : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || isSubmitting}
                >
                  {loading || isSubmitting
                    ? "Creating account..."
                    : "Create account"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="employer">
            <Form {...employerForm}>
              <form
                onSubmit={employerForm.handleSubmit(onEmployerSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={employerForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Inc."
                          autoComplete="organization"
                          disabled={loading || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={employerForm.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={loading || isSubmitting}
                            {...field}
                          >
                            <option value="">Select Industry</option>
                            <option value="technology">Technology</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance</option>
                            <option value="education">Education</option>
                            <option value="retail">Retail</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="other">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={employerForm.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={loading || isSubmitting}
                            {...field}
                          >
                            <option value="">Select Size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501-1000">501-1000 employees</option>
                            <option value="1000+">1000+ employees</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={employerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          autoComplete="name"
                          disabled={loading || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={employerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@yourcompany.com"
                          type="email"
                          autoComplete="email"
                          disabled={loading || isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={employerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={employerShowPassword ? "text" : "password"}
                            autoComplete="new-password"
                            disabled={loading || isSubmitting}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() =>
                              setEmployerShowPassword(!employerShowPassword)
                            }
                          >
                            {employerShowPassword ? (
                              <EyeOffIcon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <EyeIcon className="h-4 w-4" aria-hidden="true" />
                            )}
                            <span className="sr-only">
                              {employerShowPassword
                                ? "Hide password"
                                : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={employerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type={
                              employerShowConfirmPassword ? "text" : "password"
                            }
                            autoComplete="new-password"
                            disabled={loading || isSubmitting}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() =>
                              setEmployerShowConfirmPassword(
                                !employerShowConfirmPassword
                              )
                            }
                          >
                            {employerShowConfirmPassword ? (
                              <EyeOffIcon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <EyeIcon className="h-4 w-4" aria-hidden="true" />
                            )}
                            <span className="sr-only">
                              {employerShowConfirmPassword
                                ? "Hide password"
                                : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || isSubmitting}
                >
                  {loading || isSubmitting
                    ? "Creating account..."
                    : "Create account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
