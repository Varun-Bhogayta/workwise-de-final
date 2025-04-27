import { Link } from "react-router-dom";
import {
  Monitor,
  Code,
  DatabaseIcon,
  Palette,
  BarChart,
  Server,
  ShoppingBag,
  HeartPulse,
} from "lucide-react";


interface CategoryProps {
  icon: React.ReactNode;
  name: string;
  count: number;
  path: string;
}

const categories: CategoryProps[] = [
  {
    icon: <Code className="h-5 w-5" />,
    name: "Software Development",
    count: 1234,
    path: "/jobs?category=software-development",
  },
  {
    icon: <Monitor className="h-5 w-5" />,
    name: "IT & Networking",
    count: 873,
    path: "/jobs?category=it-networking",
  },
  {
    icon: <Palette className="h-5 w-5" />,
    name: "Design & Creative",
    count: 542,
    path: "/jobs?category=design-creative",
  },
  {
    icon: <BarChart className="h-5 w-5" />,
    name: "Business & Finance",
    count: 891,
    path: "/jobs?category=business-finance",
  },
  {
    icon: <DatabaseIcon className="h-5 w-5" />,
    name: "Data Science",
    count: 456,
    path: "/jobs?category=data-science",
  },
  {
    icon: <Server className="h-5 w-5" />,
    name: "DevOps & Cloud",
    count: 325,
    path: "/jobs?category=devops-cloud",
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    name: "Sales & Marketing",
    count: 678,
    path: "/jobs?category=sales-marketing",
  },
  {
    icon: <HeartPulse className="h-5 w-5" />,
    name: "Healthcare",
    count: 435,
    path: "/jobs?category=healthcare",
  },
];

const CategoryItem = ({ icon, name, count, path }: CategoryProps) => {
  return (
    <Link
      to={path}
      className="bg-card shadow-sm border border-border rounded-lg p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-md flex flex-col items-center text-center"
    >
      <div className="bg-primary/10 p-3 rounded-full mb-4">{icon}</div>
      <h3 className="font-medium mb-1">{name}</h3>
      <p className="text-sm text-muted-foreground">{count} jobs</p>
    </Link>
  );
};

const CategorySection = () => {
  return (
    <section className="py-16 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Browse by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore opportunities across different industries and find your
            perfect match
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <CategoryItem key={index} {...category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
