import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, BookOpen, Shield, Home } from "lucide-react";

interface RecommendationCard {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonText: string;
  action: () => void;
}

const WellnessResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const answers = location.state?.answers || {};

  const recommendations: RecommendationCard[] = [
    {
      icon: MessageCircle,
      title: "Talk it Through",
      description: "Discuss these feelings with our 24/7 AI Companion.",
      buttonText: "Start Chat",
      action: () => console.log("Start AI Chat clicked")
    },
    {
      icon: BookOpen,
      title: "Explore Resources",
      description: "View articles and exercises tailored to you.",
      buttonText: "Go to Library",
      action: () => navigate("/resources")
    },
    {
      icon: Shield,
      title: "Connect with a Pro",
      description: "Schedule a session with a university counselor.",
      buttonText: "Get Support",
      action: () => navigate("/")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-foreground tracking-wide mb-6">
            Your Check-in Summary
          </h1>
          
          <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-soft">
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Thank you for taking a moment to check in. Your responses are private and anonymous. 
              Based on your answers, here are some resources that might be helpful.
            </p>
          </div>
        </div>

        {/* Recommended Next Steps */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-foreground tracking-wide mb-8 text-center">
            Recommended Next Steps
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="group bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-soft hover:scale-105 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="p-4 rounded-2xl bg-gradient-primary text-white group-hover:scale-110 transition-transform duration-300">
                    <rec.icon className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-foreground tracking-wide">
                      {rec.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                  
                  <Button
                    onClick={rec.action}
                    className="w-full bg-gradient-primary hover:scale-105 transition-all duration-300 font-semibold rounded-2xl"
                  >
                    {rec.buttonText}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return to Dashboard */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mx-auto bg-white/50 border-white/30 hover:bg-white/70"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WellnessResults;