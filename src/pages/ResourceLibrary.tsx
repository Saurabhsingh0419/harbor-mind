import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Removed unused imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { 
  BookOpen, 
  Brain, 
  Heart, 
  PlayCircle, 
  Clock, 
  PenTool, 
  Smile,
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";

// --- Helper type for resources ---
interface Resource {
  title: string;
  type: string;
  duration: string;
  icon: React.ElementType;
  url: string; 
}

interface ArticleVideo {
  title: string;
  category: string;
  description: string;
  thumbnail: string; // This will now be a real URL
  type: string;
  url: string;
}

interface InteractiveTool {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface GuidedExercise {
  title: string;
  duration: string;
  category: string;
  description: string;
  url: string; 
}

const ResourceLibrary = () => {
  const [activeTab, setActiveTab] = useState("articles");

  const recommendedCards: Resource[] = [
    {
      title: "5 Ways to Manage Exam Stress",
      type: "Article",
      duration: "3 min read",
      icon: BookOpen,
      url: "https://www.medanta.org/patient-education-blog/5-quick-exam-stress-busting-solutions-to-beat-exam-pressure" 
    },
    {
      title: "2-Minute Guided Breathing",
      type: "Exercise",
      duration: "2 min",
      icon: Heart,
      url: "https://youtu.be/uNeoLT1axSI?si=zWbMuRBOsdRV3ms7" 
    },
    {
      title: "Sleep Better During Finals",
      type: "Video",
      duration: "8 min watch",
      icon: PlayCircle,
      url: "https://youtu.be/6-ihH6GyUQs?si=1QUfgmGp-biVUFk9" 
    },
    {
      title: "Study Break Meditation",
      type: "Exercise",
      duration: "5 min",
      icon: Brain,
      url: "https://youtu.be/zSkFFW--Ma0?si=Rl26coZq6aICA4IA" 
    }
  ];

  // --- MODIFIED: Added real thumbnail URLs ---
  const articlesVideos: ArticleVideo[] = [
    {
      title: "Understanding Anxiety",
      category: "Anxiety",
      description: "Learn about the science behind anxiety and how it affects students.",
      thumbnail: "https://images.unsplash.com/opengraph/1x1.png?auto=format&fit=crop&q=60&mark=https%3A%2F%2Fimages.unsplash.com%2Fopengraph%2Flogo.png&mark-w=64&mark-align=top%2Cleft&mark-pad=50&h=630&w=1200&blend=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1618616191524-a9721186cbe4%3Fixid%3DM3wxMjA3fDB8MXxzZWFyY2h8M3x8YW54aWV0eXxlbnwwfHx8fDE3NjEwNjM4MzF8MA%26ixlib%3Drb-4.1.0%26auto%3Dformat%26fit%3Dcrop%26q%3D60%26crop%3Dfaces%252Cedges%26h%3D630%26w%3D1200%26blend%3D000000%26blend-mode%3Dnormal%26blend-alpha%3D10%26mark-w%3D750%26mark-align%3Dmiddle%252Ccenter%26mark%3Dhttps%253A%252F%252Fimages.unsplash.com%252Fopengraph%252Fsearch-input.png%253Fauto%253Dformat%2526fit%253Dcrop%2526q%253D60%2526w%253D750%2526h%253D84%2526txt%253Danxiety%2526txt-pad%253D80%2526txt-align%253Dmiddle%25252Cleft%2526txt-color%253D%252523000000%2526txt-size%253D40%2526txt-width%253D660%2526txt-clip%253Dellipsis&blend-w=1", // Example: YouTube thumbnail
      type: "Article",
      url: "https://www.mayoclinic.org/diseases-conditions/anxiety/symptoms-causes/syc-20350961"
    },
    {
      title: "Building Healthy Study Habits",
      category: "Academic",
      description: "Practical strategies for sustainable learning and productivity.",
      thumbnail: "https://img.youtube.com/vi/1bszFX_XcbU/0.jpg", // Example: YouTube thumbnail
      type: "Video",
      url: "https://www.youtube.com/watch?v=1bszFX_XcbU"
    },
    {
      title: "Managing Social Anxiety",
      category: "Social",
      description: "Tools and techniques for navigating social situations with confidence.",
      thumbnail: "https://images.unsplash.com/photo-1604062204441-0c4497bb3cb9?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c29jaWFsJTIwYW54aWV0eXxlbnwwfHwwfHx8MA%3D%3D&fm=jpg&q=60&w=3000", // Example: YouTube thumbnail
      type: "Article",
      url: "https://jedfoundation.org/resource/understanding-anxiety-disorders/"
    },
    {
      title: "Depression: What You Need to Know",
      category: "Mental Health",
      description: "Understanding depression symptoms and when to seek help.",
      thumbnail: "https://img.youtube.com/vi/HWcphoKlbxY/0.jpg", // Example: YouTube thumbnail
      type: "Video",
      url: "https://www.youtube.com/watch?v=HWcphoKlbxY"
    },
    {
      title: "Healthy Relationships in College",
      category: "Relationships",
      description: "Building and maintaining meaningful connections during your studies.",
      thumbnail: "https://images.unsplash.com/opengraph/1x1.png?auto=format&fit=crop&q=60&mark=https%3A%2F%2Fimages.unsplash.com%2Fopengraph%2Flogo.png&mark-w=64&mark-align=top%2Cleft&mark-pad=50&h=630&w=1200&blend=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1579208570378-8c970854bc23%3Fixid%3DM3wxMjA3fDB8MXxzZWFyY2h8Mnx8aGVhbHRoeSUyMHJlbGF0aW9uc2hpcHxlbnwwfHx8fDE3NjEzNzk1MTN8MA%26ixlib%3Drb-4.1.0%26auto%3Dformat%26fit%3Dcrop%26q%3D60%26crop%3Dfaces%252Cedges%26h%3D630%26w%3D1200%26blend%3D000000%26blend-mode%3Dnormal%26blend-alpha%3D10%26mark-w%3D750%26mark-align%3Dmiddle%252Ccenter%26mark%3Dhttps%253A%252F%252Fimages.unsplash.com%252Fopengraph%252Fsearch-input.png%253Fauto%253Dformat%2526fit%253Dcrop%2526q%253D60%2526w%253D750%2526h%253D84%2526txt%253Dhealthy%252Brelationship%2526txt-pad%253D80%2526txt-align%253Dmiddle%25252Cleft%2526txt-color%253D%252523000000%2526txt-size%253D40%2526txt-width%253D660%2526txt-clip%253Dellipsis&blend-w=1", // Example: YouTube thumbnail
      type: "Article",
      url: "https://www.utep.edu/healthy-miner/resources/the-art-of-maintaining-a-healthy-relationship-in-college.html"
    },
    {
      title: "Stress Management Techniques",
      category: "Stress",
      description: "Evidence-based methods for reducing and managing stress.",
      thumbnail: "https://img.youtube.com/vi/0fL-pn80s-c/0.jpg", // Example: YouTube thumbnail
      type: "Video",
      url: "https://www.youtube.com/watch?v=0fL-pn80s-c"
    },
  ];

  const interactiveTools: InteractiveTool[] = [
    {
      title: "CBT Thought Journal",
      description: "Identify and reframe negative thought patterns with guided prompts.",
      icon: PenTool,
      color: "bg-primary/10"
    },
    {
      title: "Daily Mood Journal",
      description: "Track your emotions and reflect on your day with personalized insights.",
      icon: Smile,
      color: "bg-accent/20"
    },
    {
      title: "Goal Setting Planner",
      description: "Set achievable goals and track your progress with interactive tools.",
      icon: BookOpen,
      color: "bg-secondary/30"
    }
  ];
  
  const guidedExercises: GuidedExercise[] = [
    {
      title: "Guided Breathing for Calm",
      duration: "2 MIN",
      category: "Breathing",
      description: "Simple breathing technique to reduce anxiety and stress.",
      url: "https://www.youtube.com/watch?v=example7" 
    },
    {
      title: "Meditation for Deep Sleep",
      duration: "10 MIN",
      category: "Sleep",
      description: "Peaceful meditation to help you fall asleep naturally.",
      url: "https://www.youtube.com/watch?v=example8" 
    },
    // ... add URLs for other items ...
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header (unchanged) */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-wide">
                Resource Library
              </h1>
              <p className="text-muted-foreground mt-1">
                Knowledge and tools to support your journey
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Recommended For You Section */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6 tracking-wide">
            Recommended For You
          </h2>
          
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {recommendedCards.map((card, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block outline-none focus:ring-2 focus:ring-ring focus:rounded-lg"
                  >
                    <Card className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-glass transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 rounded-xl bg-gradient-primary text-white">
                            <card.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Badge variant="secondary" className="mb-2 text-xs">
                              {card.type}
                            </Badge>
                            <h3 className="font-medium text-foreground mb-1 line-clamp-2">
                              {card.title}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {card.duration}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>

        {/* Tabbed Content */}
        <section>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="articles" className="h-auto whitespace-normal text-xs sm:text-sm">
                Articles & Videos
              </TabsTrigger>
              <TabsTrigger value="tools" className="h-auto whitespace-normal text-xs sm:text-sm">
                Interactive Tools
              </TabsTrigger>
              <TabsTrigger value="exercises" className="h-auto whitespace-normal text-xs sm:text-sm">
                Guided Exercises
              </TabsTrigger>
            </TabsList>

            {/* Articles & Videos Tab */}
            <TabsContent value="articles" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articlesVideos.map((item, index) => (
                  <a
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block outline-none focus:ring-2 focus:ring-ring focus:rounded-lg"
                  >
                    {/* --- START OF FIX --- */}
                    <Card className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-glass transition-all duration-300 h-full">
                      {/* Replaced the div with an <img> tag */}
                      <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover" // Ensure image covers the area
                        />
                        <Badge className="absolute top-3 left-3 bg-white/90 text-foreground">
                          {item.type}
                        </Badge>
                      </div>
                      {/* --- END OF FIX --- */}

                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </TabsContent>

            {/* Interactive Tools Tab (Unchanged) */}
            <TabsContent value="tools" className="space-y-6">
              <div className="space-y-4">
                {interactiveTools.map((tool, index) => (
                  <Card key={index} className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-glass transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-4 rounded-xl ${tool.color}`}>
                          <tool.icon className="w-8 h-8 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {tool.title}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {tool.description}
                          </p>
                          <Button 
                            className="bg-gradient-primary text-white hover:opacity-90"
                          >
                            {tool.title.includes("Journal") ? "Open Journal" : "Open Tool"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Guided Exercises Tab (Unchanged) */}
            <TabsContent value="exercises" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guidedExercises.map((exercise, index) => (
                  <a
                    key={index}
                    href={exercise.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block outline-none focus:ring-2 focus:ring-ring focus:rounded-lg"
                  >
                    <Card className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-glass transition-all duration-300 h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="text-xs">
                            {exercise.category}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            {exercise.duration}
                          </div>
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">
                          {exercise.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 flex-1">
                          {exercise.description}
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full bg-gradient-primary text-white hover:opacity-90"
                          asChild 
                        >
                          <div>Start Exercise</div>
                        </Button>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
};

export default ResourceLibrary;