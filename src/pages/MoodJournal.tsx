// src/pages/MoodJournal.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const MoodJournal = () => {
  const [journalText, setJournalText] = useState("");

  const handleSaveEntry = () => {
    if (journalText.trim()) {
      // In a real app, this would save to a database
      toast.success("Entry saved successfully!", {
        description: "Your mood journal entry has been recorded."
      });
      setJournalText("");
    } else {
      toast.error("Please write something before saving.");
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
                Daily Mood Journal
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your emotions and reflect on your day
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
                How are you feeling today?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Take a moment to check in with yourself. What emotions are you experiencing? 
                What happened today that influenced your mood?
              </p>
            </div>
            
            <Textarea
              placeholder="Today I felt... The highlight of my day was... Something I'm grateful for... What I need tomorrow is..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="min-h-[300px] resize-none"
            />
            
            <Button 
              onClick={handleSaveEntry}
              className="w-full bg-gradient-primary text-white hover:opacity-90"
            >
              Save Entry
            </Button>
          </CardContent>
        </Card>

        {/* Prompts Section */}
        <Card className="mt-6 bg-white/70 backdrop-blur-md border border-white/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">Reflection Prompts</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• What emotions did I experience today?</li>
              <li>• What triggered these feelings?</li>
              <li>• What went well today?</li>
              <li>• What could I do differently tomorrow?</li>
              <li>• What am I grateful for right now?</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MoodJournal;