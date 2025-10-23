import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import CounselorCard from "./CounselorCard";

const SupportScreen = () => {
  const handleCallNow = () => {
    console.log("Emergency call initiated");
  };

  const handleBookSession = (counselorName: string) => {
    console.log(`Booking session with ${counselorName}`);
  };

  // Mock counselor data
  const counselors = [
    {
      name: "Dr. XYZ",
      specialty: "Anxiety & Academic Stress",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Dr. XYZA",
      specialty: "Depression & Life Transitions", 
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Dr. XYZAB",
      specialty: "Relationship & Social Issues",
      image: "https://images.unsplash.com/photo-1594824720863-4670a67817e8?w=400&h=400&fit=crop&crop=face"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-foreground tracking-wide">
            Professional & Immediate Support
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            You're not alone. Help is available whenever you need it.
          </p>
        </div>

        {/* Immediate Help Section */}
        <div className="mb-12">
          <div className="bg-accent/10 border-2 border-accent/30 rounded-3xl p-8 text-center shadow-soft">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
                <Phone className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground tracking-wide mb-2">
                Immediate Help
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                If you're experiencing a mental health crisis or having thoughts of self-harm, 
                please reach out immediately. Professional support is available 24/7.
              </p>
            </div>
            
            <Button 
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-12 py-4 rounded-2xl shadow-soft hover:scale-105 transition-all duration-300"
              onClick={handleCallNow}
            >
              CALL NOW
            </Button>
            
            <div className="mt-4 text-sm text-muted-foreground">
              Crisis Hotline: 14416 (Suicide & Crisis Lifeline)
            </div>
          </div>
        </div>

        {/* Schedule a Session Section */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-wide mb-8 text-center">
            Schedule a Session
          </h2>
          
          <div className="space-y-4 max-w-4xl mx-auto">
            {counselors.map((counselor, index) => (
              <CounselorCard
                key={index}
                name={counselor.name}
                specialty={counselor.specialty}
                image={counselor.image}
                onBookSession={() => handleBookSession(counselor.name)}
              />
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 text-center">
          <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-2xl mx-auto shadow-soft">
            <h3 className="text-lg font-semibold text-foreground tracking-wide mb-2">
              Additional Resources
            </h3>
            <p className="text-muted-foreground text-sm">
              Visit our Resource Library for self-help materials, wellness tips, and educational content about mental health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportScreen;