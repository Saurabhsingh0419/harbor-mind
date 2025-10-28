// src/pages/MoodJournal.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

// Type for a journal entry
interface MoodEntry {
  id: string;
  userId: string;
  entry: string;
  createdAt: Timestamp;
}

const MoodJournal = () => {
  const { user } = useAuth();
  const [newEntry, setNewEntry] = useState("");
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for journal entries
  useEffect(() => {
    if (user) {
      const entriesCollection = collection(db, "moodJournalEntries");
      const q = query(
        entriesCollection,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc") // Show newest first
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const savedEntries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MoodEntry));
        setEntries(savedEntries);
        setLoading(false);
      });

      return () => unsubscribe(); // Unsubscribe on unmount
    }
  }, [user]);

  const handleSaveEntry = async () => {
    if (!user || newEntry.trim() === "") {
      toast.error("Please write something before saving.");
      return;
    }

    try {
      await addDoc(collection(db, "moodJournalEntries"), {
        userId: user.uid,
        entry: newEntry,
        createdAt: Timestamp.now()
      });
      setNewEntry(""); // Clear textarea
      toast.success("Entry saved successfully!");
    } catch (error) {
      console.error("Error saving mood entry:", error);
      toast.error("Failed to save entry. Please try again.");
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

      {/* Page Content */}
      <div className="container mx-auto px-6 py-8 space-y-6 max-w-4xl">
        {/* New Entry Card */}
        <Card className="bg-white/70 backdrop-blur-md border border-white/20 shadow-soft">
          <CardHeader>
            <CardTitle>How are you feeling today?</CardTitle>
            <CardDescription>
              Take a moment to check in with yourself. What emotions are you experiencing?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Today I felt... The highlight of my day was... Something I'm grateful for... What I need tomorrow is..."
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              className="min-h-[150px] resize-none"
            />
            <Button
              onClick={handleSaveEntry}
              disabled={newEntry.trim() === ""}
              className="w-full bg-gradient-primary text-white hover:opacity-90"
            >
              Save Entry
            </Button>
          </CardContent>
        </Card>

        {/* Reflection Prompts */}
        <Card className="bg-white/70 backdrop-blur-md border border-white/20">
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

        {/* Past Entries */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Your Past Entries</h2>
          {loading && <p className="text-muted-foreground">Loading entries...</p>}
          {!loading && entries.length === 0 && (
            <Card className="bg-white/70 backdrop-blur-md border border-white/20">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">You haven't saved any entries yet.</p>
              </CardContent>
            </Card>
          )}
          {!loading && entries.length > 0 && (
            <ScrollArea className="h-[500px] w-full rounded-lg border">
              <div className="space-y-4 p-4">
                {entries.map((entry) => (
                  <Card key={entry.id} className="bg-white/70 backdrop-blur-md border border-white/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-3">
                        {entry.createdAt.toDate().toLocaleString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-foreground whitespace-pre-wrap">{entry.entry}</p>
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

export default MoodJournal;