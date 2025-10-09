import { useState } from "react";
import { Button } from "@/components/ui/button";
import DashboardScreen from "@/components/DashboardScreen";
import SupportScreen from "@/components/SupportScreen";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "support">("dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground tracking-wide">
              Safe Harbor
            </h1>
            <div className="flex space-x-4">
              <Button
                variant={currentScreen === "dashboard" ? "default" : "ghost"}
                className={currentScreen === "dashboard" ? "bg-gradient-primary text-white" : ""}
                onClick={() => setCurrentScreen("dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant={currentScreen === "support" ? "default" : "ghost"}
                className={currentScreen === "support" ? "bg-gradient-primary text-white" : ""}
                onClick={() => setCurrentScreen("support")}
              >
                Support
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentScreen === "dashboard" ? <DashboardScreen /> : <SupportScreen />}
    </div>
  );
};

export default Index;
