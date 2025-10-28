// src/pages/GoalPlanner.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

const GoalPlanner = () => {
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");

  const handleAddGoal = () => {
    if (goalInput.trim()) {
      setGoals([...goals, goalInput.trim()]);
      setGoalInput("");
      toast.success("Goal added!", {
        description: "Your wellness goal has been added to your planner."
      });
    } else {
      toast.error("Please enter a goal before adding.");
    }
  };

  const handleDeleteGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
    toast.success("Goal removed from planner.");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && goalInput.trim()) {
      handleAddGoal();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/resources" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-wide">
                Goal Setting Planner
              </h1>
              <p className="text-muted-foreground mt-1">
                Set and track your wellness goals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="bg-white/70 backdrop-blur-md border border-white/20 shadow-soft">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Add a New Goal
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Set specific, achievable goals for your mental wellness journey. 
                Break down larger goals into smaller, actionable steps.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Example: Practice 5 minutes of meditation daily"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleAddGoal}
                className="bg-gradient-primary text-white hover:opacity-90"
              >
                Add Goal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Goals List */}
        {goals.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              Your Goals ({goals.length})
            </h3>
            {goals.map((goal, index) => (
              <Card 
                key={index} 
                className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-glass transition-all duration-300"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-foreground">{goal}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGoal(index)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {goals.length === 0 && (
          <Card className="mt-6 bg-white/70 backdrop-blur-md border border-white/20">
            <CardContent className="p-8 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No goals yet. Add your first wellness goal above!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tips Section */}
        <Card className="mt-6 bg-white/70 backdrop-blur-md border border-white/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">Goal Setting Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Make goals specific and measurable</li>
              <li>• Start small and build gradually</li>
              <li>• Set realistic timeframes</li>
              <li>• Track your progress regularly</li>
              <li>• Celebrate small wins along the way</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoalPlanner;