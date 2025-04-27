interface MetaProps {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
}

export function updateMetaTags({
  title,
  description,
  keywords,
  image,
  url,
}: MetaProps) {
  // Update title
  document.title = `${title} | WorkWise`;

  // Find or create meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement("meta");
    metaDescription.setAttribute("name", "description");
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute("content", description || "");

  // Find or create meta keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement("meta");
    metaKeywords.setAttribute("name", "keywords");
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute("content", keywords?.join(", ") || "");

  // Open Graph tags
  updateOpenGraphTag("og:title", title);
  updateOpenGraphTag("og:description", description || "");
  updateOpenGraphTag("og:image", image || "");
  updateOpenGraphTag("og:url", url || window.location.href);

  // Twitter Card tags
  updateTwitterTag("twitter:card", "summary_large_image");
  updateTwitterTag("twitter:title", title);
  updateTwitterTag("twitter:description", description || "");
  updateTwitterTag("twitter:image", image || "");
}

function updateOpenGraphTag(property: string, content: string) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function updateTwitterTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export const defaultMetaTags: MetaProps = {
  title: "Find Your Dream Job",
  description:
    "WorkWise - Connect with top employers and find your perfect job opportunity. Post jobs, manage applications, and grow your career.",
  keywords: [
    "jobs",
    "career",
    "employment",
    "recruitment",
    "hiring",
    "job search",
    "job posting",
  ],
  image: "/og-image.jpg", // Default Open Graph image
  url: window.location.origin,
};
