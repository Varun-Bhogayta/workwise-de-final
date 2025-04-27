import { toast } from "@/components/ui/use-toast";

export const notify = {
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      duration: 5000,
    });
  },

  error: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
      duration: 7000,
    });
  },

  warning: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      className: "bg-yellow-50 border-yellow-200 text-yellow-900",
      duration: 6000,
    });
  },

  info: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
      className: "bg-blue-50 border-blue-200 text-blue-900",
      duration: 5000,
    });
  },

  loading: (title: string = "Loading...", description?: string) => {
    return toast({
      title,
      description,
      variant: "default",
      duration: undefined, // Won't auto-dismiss
    });
  },

  promise: async <T>(
    promise: Promise<T>,
    {
      loading = "Loading...",
      success = "Success!",
      error = "Something went wrong",
    }: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ) => {
    const toastId = notify.loading(loading);

    try {
      const result = await promise;
      notify.success(success);
      return result;
    } catch (err) {
      notify.error(error, err instanceof Error ? err.message : undefined);
      throw err;
    } finally {
      toastId.dismiss();
    }
  },
};
