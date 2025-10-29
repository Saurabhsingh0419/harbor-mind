import { Button } from "@/components/ui/button";
import { Phone, Heart } from "lucide-react";


const SupportScreen = () => {
 

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
              asChild
            >
              <a href="tel:14416">CALL NOW</a>
            </Button>
           
            
            <div className="mt-4 text-sm text-muted-foreground">
              Crisis Hotline: 14416 (Suicide & Crisis Lifeline)
            </div>
          </div>
        </div>

        
        <div className="mb-12">
          <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center shadow-soft">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground tracking-wide mb-2">
                A Note For You
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
                Remember that your feelings are valid. You are not a burden, and you are stronger than you know. 
                This moment of pain is temporary, even if it doesn't feel that way. 
                Be gentle with yourself,you deserve the same love and kindness you give to others.
                YOU MATTER, YOUR LIFE MATTERS.
              </p>
            </div>
          </div>
        </div>
      

      </div>
    </div>
  );
};

export default SupportScreen;