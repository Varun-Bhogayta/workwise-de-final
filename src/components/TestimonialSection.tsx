import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  company: string;
  avatar?: string;
}

const testimonials: TestimonialProps[] = [
  {
    quote: "WorkWise helped me find my dream job within weeks. The platform is intuitive, and the job matching is spot on. I couldn't be happier with my new role!",
    name: "Sarah Johnson",
    title: "Frontend Developer",
    company: "TechCorp",
    avatar: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2"
  },
  {
    quote: "As a hiring manager, WorkWise has streamlined our recruitment process significantly. We've found exceptional talent that matches our company culture perfectly.",
    name: "Michael Chen",
    title: "HR Director",
    company: "InnovateCo",
    avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2"
  },
  {
    quote: "After struggling to find the right position for months, WorkWise connected me with opportunities that truly aligned with my skills and career goals.",
    name: "Priya Patel",
    title: "Data Scientist",
    company: "DataViz",
    avatar: "https://images.pexels.com/photos/2690323/pexels-photo-2690323.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2"
  }
];

const TestimonialSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };
  
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Success Stories</h2>
            <p className="max-w-2xl mx-auto opacity-80">
              Hear what job seekers and employers have to say about their experience with WorkWise
            </p>
          </div>
          
          <div className="relative bg-primary-foreground/10 rounded-xl p-8 md:p-12 backdrop-blur-sm">
            <div className="absolute top-8 left-8 opacity-20">
              <Quote className="h-16 w-16" />
            </div>
            
            <div className="relative z-10">
              <blockquote className="text-xl md:text-2xl font-medium mb-8 text-center">
                "{testimonials[currentIndex].quote}"
              </blockquote>
              
              <div className="flex flex-col items-center">
                <Avatar className="h-16 w-16 border-2 border-primary-foreground">
                  <AvatarImage src={testimonials[currentIndex].avatar} alt={testimonials[currentIndex].name} />
                  <AvatarFallback>{testimonials[currentIndex].name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="mt-4 text-center">
                  <h4 className="font-semibold text-lg">{testimonials[currentIndex].name}</h4>
                  <p className="opacity-80">
                    {testimonials[currentIndex].title} at {testimonials[currentIndex].company}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    currentIndex === index ? "w-8 bg-primary-foreground" : "w-2 bg-primary-foreground/40"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-8 space-x-4">
            <Button
              size="icon"
              variant="secondary"
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;