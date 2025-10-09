import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Question {
  id: number;
  text: string;
  answers: string[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
    answers: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
  },
  {
    id: 2,
    text: "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
    answers: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
  },
  {
    id: 3,
    text: "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
    answers: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
  },
  {
    id: 4,
    text: "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
    answers: ["Not at all", "Several days", "More than half the days", "Nearly every day"]
  },
  {
    id: 5,
    text: "How would you rate your overall stress level this week?",
    answers: ["Very low", "Low", "Moderate", "High", "Very high"]
  },
  {
    id: 6,
    text: "How well have you been sleeping lately?",
    answers: ["Very well", "Pretty well", "Not so well", "Not well at all"]
  },
  {
    id: 7,
    text: "How connected do you feel to your support network (friends, family, community)?",
    answers: ["Very connected", "Somewhat connected", "Not very connected", "Not connected at all"]
  }
];

const WellnessCheckin = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Navigate to results with answers
      navigate('/wellness-results', { state: { answers } });
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      navigate('/');
    }
  };

  const currentAnswer = answers[questions[currentQuestion].id];
  const canProceed = currentAnswer !== undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <div className="bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-8 shadow-soft">
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-wide mb-8 text-center leading-relaxed">
            {questions[currentQuestion].text}
          </h1>

          {/* Answer Options */}
          <div className="space-y-4">
            {questions[currentQuestion].answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(answer)}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left font-medium ${
                  currentAnswer === answer
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/30 bg-white/50 text-foreground hover:border-primary/50 hover:bg-white/70"
                }`}
              >
                {answer}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center gap-2 bg-gradient-primary hover:scale-105 transition-all duration-300"
          >
            {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WellnessCheckin;