import { Link } from "react-router-dom";
import { Briefcase } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary">
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center text-xl font-bold">
              <Briefcase className="h-5 w-5 mr-2" />
              WorkWise
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting talent with opportunity, empowering careers and
              businesses to thrive together.
            </p>
          </div>

          {/* Project Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Project Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Design Engineering 2B project, completed by:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Bhogayta Varunkumar Uttambhai - 220200107011</li>
              <li>Harkhani Rajkumar Ghanshyambhai - 220200107046</li>
              <li>Sinh Sandipsinh Rajeshsinh - 220200107117</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Project techstack
            </h3>
            <div className="flex items-center gap-10">
            <div>
            <p className="text-md ">FrontEnd :</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>React + Vite</li>
              <li>Tailwind CSS</li>
              <li>React Router</li>
              <li>Zod</li>
            </ul>
            </div>
            <div>
            <p className="text-md ">BackEnd :</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
             <li>FireBase Authentication</li>
              <li>FireBase Firestore</li>
              <li>FireBase Storage</li>
              <li>FireBase Hosting</li>
             </ul> 
             </div>
             </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex justify-center items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} WorkWise - Design Engineering Project. All
              rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
