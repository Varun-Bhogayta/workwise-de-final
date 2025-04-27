import { toast } from "@/components/ui/use-toast";

interface ErrorWithCode extends Error {
  code?: string;
}

export function handleError(
  error: unknown,
  defaultMessage: string = "An error occurred"
): string {
  console.error(error);

  if (!navigator.onLine) {
    return "You are offline. Please check your internet connection and try again.";
  }

  const err = error as ErrorWithCode;

  // Firebase Auth errors
  if (err.code?.startsWith("auth/")) {
    switch (err.code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/email-already-in-use":
        return "This email is already in use. Try logging in instead.";
      case "auth/invalid-email":
        return "Invalid email address format.";
      case "auth/weak-password":
        return "Password is too weak. Please use a stronger password.";
      case "auth/popup-closed-by-user":
        return "Login cancelled. You closed the login window.";
      case "auth/popup-blocked":
        return "Login popup was blocked. Please allow popups for this site.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      default:
        return err.message || defaultMessage;
    }
  }

  // Firebase Storage errors
  if (err.code?.startsWith("storage/")) {
    switch (err.code) {
      case "storage/object-not-found":
        return "The requested file does not exist.";
      case "storage/unauthorized":
        return "You don't have permission to access this file.";
      case "storage/canceled":
        return "Upload cancelled.";
      case "storage/retry-limit-exceeded":
        return "Upload failed. Please try again.";
      default:
        return err.message || "Storage operation failed.";
    }
  }

  // Firebase Firestore errors
  if (err.code?.startsWith("firestore/")) {
    switch (err.code) {
      case "firestore/permission-denied":
        return "You don't have permission to perform this operation.";
      case "firestore/not-found":
        return "The requested document does not exist.";
      case "firestore/already-exists":
        return "Document already exists.";
      default:
        return err.message || "Database operation failed.";
    }
  }

  return err.message || defaultMessage;
}

export function showErrorToast(error: unknown, title: string = "Error") {
  const message = handleError(error);
  toast({
    title,
    description: message,
    variant: "destructive",
  });
  return message;
}

export function showSuccessToast(title: string, description: string) {
  toast({
    title,
    description,
  });
}
