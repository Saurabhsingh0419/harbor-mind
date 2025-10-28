// src/pages/CbtJournal.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const CbtJournal = () => {
  const [journalText, setJournalText] = useState("");

  const handleSaveEntry = () => {
    if (journalText.trim()) {
      // In a real app, this would save to a database
      toast.success("Entry saved successfully!", {
        description: "Your thought journal entry has been recorded."
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
                CBT Thought Journal
              </h1>
              <p className="text-muted-foreground mt-1">
                Challenge and reframe your thought patterns
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
                Record Your Thoughts
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Identify negative thought patterns and challenge them with evidence-based thinking. 
                Write down what you're thinking, examine the evidence, and reframe your perspective.
              </p>
            </div>
            
            <Textarea
              placeholder="Example: 'I always mess things up...' → Evidence: What actually happened? → Reframe: 'I made a mistake, but I can learn from it.'"
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

        {/* Tips Section */}
        <Card className="mt-6 bg-white/70 backdrop-blur-md border border-white/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">CBT Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Identify the negative thought clearly</li>
              <li>• Look for evidence that supports or contradicts it</li>
              <li>• Consider alternative explanations</li>
              <li>• Reframe the thought in a more balanced way</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CbtJournal;