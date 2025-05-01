import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadImage } from "@/lib/storage-utils";
import { Loader2, Upload } from "lucide-react";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null); // Save the previous image URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    // Common fields
    name: "",
    email: "",
    location: "",
    phone: "",
    bio: "",
    avatar_url: "",

    // Jobseeker specific fields
    title: "",
    skills: "",
    experience: "",
    education: "",
    resume_url: "",

    // Employer specific fields
    company_name: "",
    company_logo_url: "",
    company_website: "",
    company_industry: "",
    company_size: "",
    company_about: "",
    company_founded: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const profileDoc = await getDoc(doc(db, "profiles", user.id));

        if (profileDoc.exists()) {
          const profileData = profileDoc.data();

          setFormData({
            // Common fields
            name: profileData.full_name || profileData.company_name || "",
            email: profileData.email || user.email || "",
            location: profileData.location || "",
            phone: profileData.phone || "",
            bio: profileData.bio || profileData.company_about || "",
            avatar_url:
              profileData.avatar_url || profileData.company_logo_url || "",

            // Jobseeker specific fields
            title: profileData.title || "",
            skills: (profileData.skills || []).join(", "),
            experience: profileData.experience || "",
            education: profileData.education || "",
            resume_url: profileData.resume_url || "",

            // Employer specific fields
            company_name: profileData.company_name || "",
            company_logo_url: profileData.company_logo_url || "",
            company_website: profileData.company_website || "",
            company_industry: profileData.company_industry || "",
            company_size: profileData.company_size || "",
            company_about: profileData.company_about || "",
            company_founded: profileData.company_founded?.toString() || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Prepare profile data based on user role
      const profileData =
        user.role === "employer"
          ? {
              company_name: formData.company_name,
              company_logo_url: formData.company_logo_url,
              company_website: formData.company_website,
              company_industry: formData.company_industry,
              company_size: formData.company_size,
              company_about: formData.bio,
              company_founded: formData.company_founded
                ? parseInt(formData.company_founded)
                : null,
              email: formData.email,
              location: formData.location,
              phone: formData.phone,
              updated_at: new Date().toISOString(),
            }
          : {
              full_name: formData.name,
              email: formData.email,
              title: formData.title,
              bio: formData.bio,
              location: formData.location,
              phone: formData.phone,
              skills: formData.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean),
              experience: formData.experience,
              education: formData.education,
              resume_url: formData.resume_url,
              avatar_url: formData.avatar_url,
              updated_at: new Date().toISOString(),
            };

      // Update profile in Firestore
      await updateDoc(doc(db, "profiles", user.id), profileData);

      // Update profile in auth context
      await updateProfile(profileData);

      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      // Save the current image URL before starting upload
      const currentImageUrl = user.role === "employer" 
        ? formData.company_logo_url 
        : formData.avatar_url;
      setPreviousImageUrl(currentImageUrl);
      
      // Create a preview URL for immediate feedback
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Reset upload state
      setUploadingPhoto(true);
      setUploadProgress(0);
      
      // Set a timeout to prevent infinite loading (30 seconds max)
      const timeout = setTimeout(() => {
        // If this executes, the upload has taken too long
        setUploadingPhoto(false);
        setUploadProgress(0);
        setImagePreview(null);
        
        // Clean up the preview URL to prevent memory leaks
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        
        toast({
          title: "Upload timeout",
          description: "The upload is taking too long. Please try again with a smaller image.",
          variant: "destructive",
        });
      }, 30000); // 30 seconds timeout
      
      setUploadTimeout(timeout);
      
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          // Only go up to 90% to show it's still processing
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 300);
      
      const folder = user.role === "employer" ? "company_logos" : "avatars";
      const downloadURL = await uploadImage(file, folder);
      
      // Clear the intervals and timeouts
      clearInterval(progressInterval);
      clearTimeout(timeout);
      setUploadTimeout(null);
      
      // Finish progress
      setUploadProgress(100);

      if (downloadURL) {
        if (user.role === "employer") {
          setFormData({ ...formData, company_logo_url: downloadURL });

          // Update the Firestore document right away to ensure consistency
          await updateDoc(doc(db, "profiles", user.id), {
            company_logo_url: downloadURL,
            updated_at: new Date().toISOString(),
          });
        } else {
          setFormData({ ...formData, avatar_url: downloadURL });

          // Update the Firestore document right away to ensure consistency
          await updateDoc(doc(db, "profiles", user.id), {
            avatar_url: downloadURL,
            updated_at: new Date().toISOString(),
          });
        }

        // Refresh the image by updating the key
        setRefreshKey(Date.now());
        // Clear the preview URL since we're now using the actual URL
        setImagePreview(null);
        // Clean up the preview URL to prevent memory leaks
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        // Clear the saved previous URL
        setPreviousImageUrl(null);

        toast({
          title: "Photo uploaded",
          description: "Your profile photo was uploaded successfully.",
        });
      } else {
        throw new Error("Failed to upload photo");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      
      // Clean up any timers
      if (uploadTimeout) {
        clearTimeout(uploadTimeout);
        setUploadTimeout(null);
      }
      
      // Clear the preview on error
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      
      // Restore previous image if available
      if (user.role === "employer" && previousImageUrl) {
        setFormData(prev => ({ ...prev, company_logo_url: previousImageUrl }));
      } else if (previousImageUrl) {
        setFormData(prev => ({ ...prev, avatar_url: previousImageUrl }));
      }
      
      // Reset loading state
      setUploadProgress(0);
      
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo. Please try again with a smaller image.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      // Clean up any hanging timers when component unmounts
      if (uploadTimeout) {
        clearTimeout(uploadTimeout);
      }
      // Clean up image preview URL
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [uploadTimeout, imagePreview]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <p>Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  key={refreshKey}
                  src={
                    imagePreview || 
                    (user.role === "employer"
                      ? formData.company_logo_url
                      : formData.avatar_url)
                  }
                  alt={
                    user.role === "employer"
                      ? "Company Logo"
                      : "Profile Picture"
                  }
                />
                <AvatarFallback>
                  {user.role === "employer"
                    ? formData.company_name?.charAt(0) || "C"
                    : formData.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {uploadingPhoto && uploadProgress > 0 && (
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-xs font-semibold">
                    {uploadProgress}%
                  </div>
                </div>
              )}
              {isEditing && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full"
                  onClick={triggerFileInput}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Profile Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {user.role === "employer"
                  ? "Employer Account"
                  : "Job Seeker Account"}
              </p>
            </div>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : null}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {user.role === "employer" ? (
              // Employer Profile Form
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_website">Website</Label>
                    <Input
                      id="company_website"
                      value={formData.company_website}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_website: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_industry">Industry</Label>
                    <Input
                      id="company_industry"
                      value={formData.company_industry}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_industry: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_size">Company Size</Label>
                    <Select
                      disabled={!isEditing}
                      value={formData.company_size}
                      onValueChange={(value) =>
                        setFormData({ ...formData, company_size: value })
                      }
                    >
                      <SelectTrigger id="company_size">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">
                          201-500 employees
                        </SelectItem>
                        <SelectItem value="501-1000">
                          501-1000 employees
                        </SelectItem>
                        <SelectItem value="1001+">1001+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_founded">Founded Year</Label>
                    <Input
                      id="company_founded"
                      type="number"
                      value={formData.company_founded}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_founded: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_logo_url">Logo URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="company_logo_url"
                        value={formData.company_logo_url}
                        disabled={!isEditing || uploadingPhoto}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            company_logo_url: e.target.value,
                          })
                        }
                      />
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileInput}
                          disabled={uploadingPhoto}
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploading...'}
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <Label htmlFor="bio">Company Description</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="h-32"
                  />
                </div>
              </div>
            ) : (
              // Job Seeker Profile Form
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar_url">Profile Picture URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="avatar_url"
                        value={formData.avatar_url}
                        disabled={!isEditing || uploadingPhoto}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            avatar_url: e.target.value,
                          })
                        }
                      />
                      {isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileInput}
                          disabled={uploadingPhoto}
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploading...'}
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma separated)</Label>
                    <Input
                      id="skills"
                      value={formData.skills}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, skills: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resume_url">Resume URL</Label>
                    <Input
                      id="resume_url"
                      value={formData.resume_url}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, resume_url: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="h-32"
                  />
                </div>

                <div className="space-y-2 mt-6">
                  <Label htmlFor="experience">Work Experience</Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                    className="h-32"
                  />
                </div>

                <div className="space-y-2 mt-6">
                  <Label htmlFor="education">Education</Label>
                  <Textarea
                    id="education"
                    value={formData.education}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    className="h-32"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
