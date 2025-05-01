/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  uid: string; // Add uid property that matches id for compatibility
  email: string;
  name?: string;
  role: "jobseeker" | "employer";
  avatar_url?: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  role: "jobseeker" | "employer";
  name?: string;
  companyName?: string;
  industry?: string;
  size?: string;
}

interface ProfileData {
  full_name?: string;
  company_name?: string;
  avatar_url?: string;
  company_logo_url?: string;
  company_industry?: string;
  company_size?: string;
  [key: string]: any; // Allow for additional properties
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: ProfileData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  clearError: () => {},
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      enableNetwork(db).catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
      disableNetwork(db).catch(console.error);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          if (!isOnline) {
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "",
              role: "jobseeker", // Default role when offline
              avatar_url: firebaseUser.photoURL,
            });
            setLoading(false);
            return;
          }

          // Get the user profile data from Firestore
          const userDoc = await getDoc(doc(db, "profiles", firebaseUser.uid));

          if (!userDoc.exists()) {
            console.error("Error fetching user profile: No such document");
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "",
              role: "jobseeker", // Default role when profile not found
              avatar_url: firebaseUser.photoURL,
            });
          } else {
            const profile = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name:
                profile.full_name ||
                profile.company_name ||
                firebaseUser.displayName ||
                "",
              role: profile.role || "jobseeker",
              avatar_url:
                profile.avatar_url ||
                profile.company_logo_url ||
                firebaseUser.photoURL,
            });
          }
        } catch (err) {
          console.error("Error in auth state change:", err);
          // Still set basic user info even if Firestore fails
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "",
            role: "jobseeker", // Default role when error occurs
            avatar_url: firebaseUser.photoURL,
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOnline]);

  const clearError = () => {
    setError(null);
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!isOnline) {
        throw new Error(
          "You are offline. Please check your internet connection and try again."
        );
      }

      const { user: firebaseUser } = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (firebaseUser) {
        try {
          // Get the user profile data from Firestore
          const userDoc = await getDoc(doc(db, "profiles", firebaseUser.uid));

          if (!userDoc.exists()) {
            console.error("Error fetching user profile: No such document");
            // Create a basic profile if none exists
            const newProfile = {
              id: firebaseUser.uid,
              role: "jobseeker",
              email: firebaseUser.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            await setDoc(doc(db, "profiles", firebaseUser.uid), newProfile);

            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: "jobseeker",
              avatar_url: null,
            });

            toast({
              title: "Profile created",
              description: "A basic profile has been created for you",
            });
          } else {
            const profile = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: profile.full_name || profile.company_name,
              role: profile.role,
              avatar_url: profile.avatar_url || profile.company_logo_url,
            });

            toast({
              title: "Success!",
              description: "You have successfully logged in",
            });
          }
        } catch (firestoreErr) {
          console.error("Firestore error:", firestoreErr);

          // Still log the user in with basic info
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            role: "jobseeker", // Default role
            avatar_url: null,
          });

          toast({
            title: "Partial login successful",
            description:
              "Logged in, but your profile couldn't be loaded. Some features might be limited.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      let errorMessage = "Login failed. Please try again.";

      if (!navigator.onLine) {
        errorMessage =
          "You are offline. Please check your internet connection and try again.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password.";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage =
          "Too many failed login attempts. Please try again later.";
      } else if (err.code === "auth/invalid-credential") {
        errorMessage = "Invalid login credentials. Please try again.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err; // Re-throw to allow component to handle the error state
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isOnline) {
        throw new Error(
          "You are offline. Please check your internet connection and try again."
        );
      }

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      if (!firebaseUser) {
        throw new Error("Failed to authenticate with Google");
      }

      try {
        // Check if this is an existing user by looking for their profile
        const userDoc = await getDoc(doc(db, "profiles", firebaseUser.uid));

        if (!userDoc.exists()) {
          // This is a new user - create a basic jobseeker profile
          const newUser = {
            id: firebaseUser.uid,
            role: "jobseeker",
            full_name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            avatar_url: firebaseUser.photoURL || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Insert the new profile
          await setDoc(doc(db, "profiles", firebaseUser.uid), newUser);

          // Set user state
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "",
            role: "jobseeker",
            avatar_url: firebaseUser.photoURL,
          });

          toast({
            title: "Account created!",
            description:
              "Your account has been created and you're now logged in.",
          });
        } else {
          // Existing user - just set the user state
          const existingProfile = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name:
              existingProfile.full_name ||
              existingProfile.company_name ||
              firebaseUser.displayName ||
              "",
            role: existingProfile.role || "jobseeker",
            avatar_url:
              existingProfile.avatar_url ||
              existingProfile.company_logo_url ||
              firebaseUser.photoURL,
          });

          toast({
            title: "Success!",
            description: "You have successfully logged in",
          });
        }
      } catch (firestoreErr) {
        console.error("Firestore error during Google login:", firestoreErr);

        // Still log the user in with basic Google info
        setUser({
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || "",
          role: "jobseeker", // Default role
          avatar_url: firebaseUser.photoURL,
        });

        toast({
          title: "Partial login successful",
          description:
            "Logged in with Google, but your profile couldn't be loaded. Some features might be limited.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      let errorMessage = "Google login failed. Please try again.";

      if (!navigator.onLine) {
        errorMessage =
          "You are offline. Please check your internet connection and try again.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "Login cancelled. You closed the Google login window.";
      } else if (err.code === "auth/popup-blocked") {
        errorMessage =
          "Login popup was blocked. Please allow popups for this site.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw err; // Re-throw to allow component to handle the error state
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);

      if (!isOnline) {
        throw new Error(
          "You are offline. Please check your internet connection and try again."
        );
      }

      // Create the user in Firebase Auth
      const result = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const firebaseUser = result.user;

      // Create a profile in Firestore based on the user role
      const now = new Date().toISOString();
      let profileData: any;

      if (userData.role === "employer") {
        profileData = {
          id: firebaseUser.uid,
          email: userData.email,
          role: "employer",
          company_name: userData.companyName || "",
          company_industry: userData.industry || "",
          company_size: userData.size || "",
          full_name: userData.name || "",
          created_at: now,
          updated_at: now,
        };

        // Also create a company record
        const companyData = {
          id: firebaseUser.uid,
          name: userData.companyName || "",
          company_name: userData.companyName || "",
          company_industry: userData.industry || "",
          company_size: userData.size || "",
          created_at: now,
          updated_at: now,
          is_verified: false,
          _count: { jobs: 0 },
        };

        try {
          await setDoc(doc(db, "companies", firebaseUser.uid), companyData);
        } catch (companyErr) {
          console.error("Error creating company record:", companyErr);
          // Continue with user registration even if company creation fails
          toast({
            title: "Partial registration",
            description:
              "Your account was created but company profile setup had an issue.",
            variant: "destructive",
          });
        }
      } else {
        profileData = {
          id: firebaseUser.uid,
          email: userData.email,
          role: "jobseeker",
          full_name: userData.name || "",
          created_at: now,
          updated_at: now,
        };
      }

      // Create the profile document
      try {
        await setDoc(doc(db, "profiles", firebaseUser.uid), profileData);
      } catch (profileErr) {
        console.error("Error creating profile:", profileErr);
        toast({
          title: "Profile setup issue",
          description:
            "Your account was created but profile setup had an issue. Some features may be limited.",
          variant: "destructive",
        });
      }

      // Set the user state
      setUser({
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        name:
          userData.role === "jobseeker" ? userData.name : userData.companyName,
        role: userData.role,
        avatar_url: null,
      });

      toast({
        title: "Account created!",
        description: "You have successfully registered and logged in",
      });
    } catch (err: any) {
      console.error("Registration error:", err);

      let errorMessage = "Registration failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use. Try logging in instead.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use a stronger password.";
      }

      setError(errorMessage);
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (err: any) {
      console.error("Logout error:", err);
      toast({
        title: "Logout failed",
        description: "Something went wrong while logging out",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (profileData: ProfileData) => {
    try {
      setLoading(true);

      if (!user) throw new Error("Not authenticated");

      // Filter out undefined values to prevent Firestore errors
      const cleanedProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined)
      );

      // Add a timestamp for the update
      cleanedProfileData.updated_at = new Date().toISOString();

      // Handle potential CORS issues with avatars or logos by validating URLs
      if (
        cleanedProfileData.avatar_url &&
        typeof cleanedProfileData.avatar_url === "string" &&
        cleanedProfileData.avatar_url.startsWith("blob:")
      ) {
        console.warn(
          "Received blob URL instead of a Storage URL. This might indicate that the file upload hasn't completed yet."
        );
        // Keep the previous avatar URL to prevent issues
        delete cleanedProfileData.avatar_url;
      }

      if (
        cleanedProfileData.company_logo_url &&
        typeof cleanedProfileData.company_logo_url === "string" &&
        cleanedProfileData.company_logo_url.startsWith("blob:")
      ) {
        console.warn(
          "Received blob URL instead of a Storage URL. This might indicate that the file upload hasn't completed yet."
        );
        // Keep the previous logo URL to prevent issues
        delete cleanedProfileData.company_logo_url;
      }

      // Update the profile in Firestore
      await updateDoc(doc(db, "profiles", user.id), cleanedProfileData);

      // If the user is an employer, also update the company data
      if (user.role === "employer") {
        // Check if company record exists first
        const companyDoc = await getDoc(doc(db, "companies", user.id));

        // Prepare company data with updated fields
        const companyData: Record<string, any> = {
          name: profileData.company_name,
          company_name: profileData.company_name,
          company_logo_url: profileData.company_logo_url,
          updated_at: new Date().toISOString(),
        };

        // Only add fields that have values
        if (profileData.company_website)
          companyData.company_website = profileData.company_website;
        if (profileData.company_industry)
          companyData.company_industry = profileData.company_industry;
        if (profileData.company_size)
          companyData.company_size = profileData.company_size;

        // Use bio or company_about for description, only if defined
        if (profileData.company_about) {
          companyData.company_description = profileData.company_about;
        } else if (profileData.bio) {
          companyData.company_description = profileData.bio;
        }

        if (profileData.location) companyData.location = profileData.location;

        if (companyDoc.exists()) {
          // Update existing company document
          await updateDoc(doc(db, "companies", user.id), companyData);
        } else {
          // Create new company document
          await setDoc(doc(db, "companies", user.id), {
            id: user.id,
            ...companyData,
            created_at: new Date().toISOString(),
            is_verified: false,
            _count: { jobs: 0 },
          });
        }
      }

      // Update the local user state with new data
      setUser({
        ...user,
        uid: user.id,
        name: profileData.full_name || profileData.company_name || user.name,
        avatar_url:
          profileData.avatar_url ||
          profileData.company_logo_url ||
          user.avatar_url,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Profile update failed. Please try again.");
      toast({
        title: "Update failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        clearError,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
