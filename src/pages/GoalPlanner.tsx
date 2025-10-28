// src/pages/GoalPlanner.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Target, Check } from "lucide-react";
import { toast } from "sonner";

// Type for a goal
interface GoalEntry {
  id: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
}

const GoalPlanner = () => {
  const { user } = useAuth();
  const [newGoal, setNewGoal] = useState("");
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for goals
  useEffect(() => {
    if (user) {
      const goalsCollection = collection(db, "goalPlannerEntries");
      const q = query(
        goalsCollection,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc") // Show newest first
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const savedGoals = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as GoalEntry));
        setGoals(savedGoals);
        setLoading(false);
      });

      return () => unsubscribe(); // Unsubscribe on unmount
    }
  }, [user]);

  const handleAddGoal = async () => {
    if (!user || newGoal.trim() === "") {
      toast.error("Please enter a goal before adding.");
      return;
    }

    try {
      await addDoc(collection(db, "goalPlannerEntries"), {
        userId: user.uid,
        text: newGoal,
        createdAt: Timestamp.now()
      });
      setNewGoal(""); // Clear input
      toast.success("Goal added!");
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to add goal. Please try again.");
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "goalPlannerEntries", goalId));
      toast.success("Goal completed! 🎉");
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to complete goal. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newGoal.trim()) {
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

      {/* Page Content */}
      <div className="container mx-auto px-6 py-8 space-y-6 max-w-4xl">
        {/* New Goal Input */}
        <Card className="bg-white/70 backdrop-blur-md border border-white/20 shadow-soft">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Add a New Goal</h3>
              <p className="text-sm text-muted-foreground">
                Set specific, achievable goals for your mental wellness journey.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Example: Practice 5 minutes of meditation daily"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleAddGoal}
                disabled={newGoal.trim() === ""}
                className="bg-gradient-primary text-white hover:opacity-90"
              >
                Add Goal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Goal Setting Tips */}
        <Card className="bg-white/70 backdrop-blur-md border border-white/20">
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

        {/* Current Goals */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Your Current Goals {goals.length > 0 && `(${goals.length})`}
          </h2>
          {loading && <p className="text-muted-foreground">Loading goals...</p>}
          {!loading && goals.length === 0 && (
            <Card className="bg-white/70 backdrop-blur-md border border-white/20">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No goals yet. Add your first wellness goal above!
                </p>
              </CardContent>
            </Card>
          )}
          {!loading && goals.length > 0 && (
            <ScrollArea className="h-[500px] w-full rounded-lg border">
              <div className="space-y-3 p-4">
                {goals.map((goal) => (
                  <Card 
                    key={goal.id} 
                    className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-glass transition-all duration-300"
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground break-words">{goal.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added {goal.createdAt.toDate().toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600 hover:text-green-700 hover:bg-green-100 flex-shrink-0"
                        onClick={() => handleCompleteGoal(goal.id)}
                        title="Mark as complete"
                      >
                        <Check className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalPlanner;