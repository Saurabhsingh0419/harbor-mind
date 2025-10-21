import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Question {
  id: number;
  text: string;
  answers: string[];
  test: 'GAD-7' | 'PHQ-9';
}

const answerScale = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

const questions: Question[] = [
  // GAD-7 Questions (Anxiety)
  { id: 1, test: 'GAD-7', text: "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?", answers: answerScale },
  { id: 2, test: 'GAD-7', text: "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?", answers: answerScale },
  { id: 3, test: 'GAD-7', text: "Over the last 2 weeks, how often have you been bothered by worrying too much about different things?", answers: answerScale },
  { id: 4, test: 'GAD-7', text: "Over the last 2 weeks, how often have you been bothered by trouble relaxing?", answers: answerScale },
  { id: 5, test: 'GAD-7', text: "Over the last 2 weeks, how often have you been bothered by being so restless that it is hard to sit still?", answers: answerScale },
  { id: 6, test: 'GAD-7', text: "Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable?", answers: answerScale },
  { id: 7, test: 'GAD-7', text: "Over the last 2 weeks, how often have you been bothered by feeling afraid as if something awful might happen?", answers: answerScale },
  // PHQ-9 Questions (Depression)
  { id: 8, test: 'PHQ-9', text: "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?", answers: answerScale },
  { id: 9, test: 'PHQ-9', text: "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?", answers: answerScale },
  { id: 10, test: 'PHQ-9', text: "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?", answers: answerScale },
  { id: 11, test: 'PHQ-9', text: "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?", answers: answerScale },
  { id: 12, test: 'PHQ-9', text: "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?", answers: answerScale },
  { id: 13, test: 'PHQ-9', text: "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself - or that you are a failure or have let yourself or your family down?", answers: answerScale },
  { id: 14, test: 'PHQ-9', text: "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?", answers: answerScale },
  { id: 15, test: 'PHQ-9', text: "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual?", answers: answerScale },
  { id: 16, test: 'PHQ-9', text: "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself in some way?", answers: answerScale }
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
      // Navigate to results with answers and questions
      navigate('/wellness-results', { state: { answers, questions } });
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
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              {questions[currentQuestion].test}
            </span>
          </div>
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