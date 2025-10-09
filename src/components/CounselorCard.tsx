import { Button } from "@/components/ui/button";

interface CounselorCardProps {
  name: string;
  specialty: string;
  image: string;
  onBookSession?: () => void;
}

const CounselorCard = ({ name, specialty, image, onBookSession }: CounselorCardProps) => {
  return (
    <div className="flex items-center space-x-4 p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-white/20 shadow-soft hover:shadow-glass transition-all duration-300">
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-gradient-primary overflow-hidden">
          <img 
            src={image} 
            alt={`${name} - Counselor`}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-foreground tracking-wide">
          {name}
        </h3>
        <p className="text-muted-foreground font-normal">
          {specialty}
        </p>
      </div>
      
      <Button 
        variant="outline"
        className="bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-gradient-primary hover:text-white transition-all duration-300"
        onClick={onBookSession}
      >
        Book a Session
      </Button>
    </div>
  );
};

export default CounselorCard;