import { CheckSquare, MessageCircle, BookOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeatureCard from "./FeatureCard";
import heroCalm from "@/assets/hero-calm.jpg";
import { useNavigate } from "react-router-dom";

const DashboardScreen = () => {
  const navigate = useNavigate();

  const handleBeginClick = () => {
    console.log("Begin daily calm clicked");
  };

  const handleFeatureClick = (feature: string) => {
    if (feature === "Resource Library") {
      navigate("/resources");
    } else if (feature === "Wellness Check-in") {
      navigate("/wellness-checkin");
    } else {
      console.log(`${feature} clicked`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-foreground tracking-wide mb-4">
            Welcome back. How are you feeling today?
          </h1>
          
          {/* Motivational Quote */}
          <p className="text-lg italic text-muted-foreground max-w-2xl mx-auto">
            "Be gentle with yourself, you're doing the best you can."
          </p>
        </div>

        {/* Hero Component */}
        <div className="mb-12">
          <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-md border border-white/20 shadow-soft p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-semibold text-foreground tracking-wide mb-6">
                  Your Daily Calm
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Take a moment to center yourself and start your day with intention and peace.
                </p>
                <Button 
                  size="lg"
                  className="bg-gradient-primary hover:scale-105 transition-all duration-300 text-white font-semibold px-8 py-4 rounded-2xl shadow-soft"
                  onClick={handleBeginClick}
                >
                  Begin
                </Button>
              </div>
              
              <div className="flex-1 max-w-md">
                <div className="rounded-2xl overflow-hidden shadow-glass">
                  <img 
                    src={heroCalm}
                    alt="Calming abstract illustration"
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            icon={CheckSquare}
            title="Wellness Check-in"
            onClick={() => handleFeatureClick("Wellness Check-in")}
          />
          
          <FeatureCard
            icon={MessageCircle}
            title="AI Companion"
            onClick={() => handleFeatureClick("AI Companion")}
          />
          
          <FeatureCard
            icon={BookOpen}
            title="Resource Library"
            onClick={() => handleFeatureClick("Resource Library")}
          />
          
          <FeatureCard
            icon={Shield}
            title="Get Support"
            onClick={() => handleFeatureClick("Get Support")}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;