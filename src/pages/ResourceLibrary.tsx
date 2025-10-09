import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const ResourceLibrary = () => {
  const [activeTab, setActiveTab] = useState("articles");

  const recommendedCards = [
    {
      title: "5 Ways to Manage Exam Stress",
      type: "Article",
      duration: "3 min read",
      icon: BookOpen
    },
    {
      title: "2-Minute Guided Breathing",
      type: "Exercise",
      duration: "2 min",
      icon: Heart
    },
    {
      title: "Sleep Better During Finals",
      type: "Video",
      duration: "8 min watch",
      icon: PlayCircle
    },
    {
      title: "Study Break Meditation",
      type: "Exercise",
      duration: "5 min",
      icon: Brain
    }
  ];

  const articlesVideos = [
    {
      title: "Understanding Anxiety",
      category: "Anxiety",
      description: "Learn about the science behind anxiety and how it affects students.",
      thumbnail: "/placeholder.svg",
      type: "Article"
    },
    {
      title: "Building Healthy Study Habits",
      category: "Academic",
      description: "Practical strategies for sustainable learning and productivity.",
      thumbnail: "/placeholder.svg",
      type: "Video"
    },
    {
      title: "Managing Social Anxiety",
      category: "Social",
      description: "Tools and techniques for navigating social situations with confidence.",
      thumbnail: "/placeholder.svg",
      type: "Article"
    },
    {
      title: "Depression: What You Need to Know",
      category: "Mental Health",
      description: "Understanding depression symptoms and when to seek help.",
      thumbnail: "/placeholder.svg",
      type: "Video"
    },
    {
      title: "Healthy Relationships in College",
      category: "Relationships",
      description: "Building and maintaining meaningful connections during your studies.",
      thumbnail: "/placeholder.svg",
      type: "Article"
    },
    {
      title: "Stress Management Techniques",
      category: "Stress",
      description: "Evidence-based methods for reducing and managing stress.",
      thumbnail: "/placeholder.svg",
      type: "Video"
    }
  ];

  const interactiveTools = [
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

  const guidedExercises = [
    {
      title: "Guided Breathing for Calm",
      duration: "2 MIN",
      category: "Breathing",
      description: "Simple breathing technique to reduce anxiety and stress."
    },
    {
      title: "Meditation for Deep Sleep",
      duration: "10 MIN",
      category: "Sleep",
      description: "Peaceful meditation to help you fall asleep naturally."
    },
    {
      title: "Progressive Muscle Relaxation",
      duration: "8 MIN",
      category: "Relaxation",
      description: "Release physical tension and promote mental calm."
    },
    {
      title: "Mindful Study Break",
      duration: "5 MIN",
      category: "Focus",
      description: "Reset your mind between study sessions for better focus."
    },
    {
      title: "Morning Energy Boost",
      duration: "7 MIN",
      category: "Energy",
      description: "Start your day with positive intention and gentle movement."
    },
    {
      title: "Evening Wind Down",
      duration: "12 MIN",
      category: "Relaxation",
      description: "Gentle transition from day to night with calming exercises."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                  <Card className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-glass transition-all duration-300 cursor-pointer">
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
              <TabsTrigger value="articles">Articles & Videos</TabsTrigger>
              <TabsTrigger value="tools">Interactive Tools</TabsTrigger>
              <TabsTrigger value="exercises">Guided Exercises</TabsTrigger>
            </TabsList>

            {/* Articles & Videos Tab */}
            <TabsContent value="articles" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articlesVideos.map((item, index) => (
                  <Card key={index} className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-glass transition-all duration-300 cursor-pointer">
                    <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-hero flex items-center justify-center">
                        {item.type === "Video" ? (
                          <PlayCircle className="w-12 h-12 text-primary" />
                        ) : (
                          <BookOpen className="w-12 h-12 text-primary" />
                        )}
                      </div>
                      <Badge className="absolute top-3 left-3 bg-white/90 text-foreground">
                        {item.type}
                      </Badge>
                    </div>
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
                ))}
              </div>
            </TabsContent>

            {/* Interactive Tools Tab */}
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

            {/* Guided Exercises Tab */}
            <TabsContent value="exercises" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guidedExercises.map((exercise, index) => (
                  <Card key={index} className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-glass transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
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
                      <p className="text-sm text-muted-foreground mb-4">
                        {exercise.description}
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-primary text-white hover:opacity-90"
                      >
                        Start Exercise
                      </Button>
                    </CardContent>
                  </Card>
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