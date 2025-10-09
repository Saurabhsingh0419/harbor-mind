import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  onClick?: () => void;
}

const FeatureCard = ({ icon: Icon, title, onClick }: FeatureCardProps) => {
  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/20 p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-glass"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 rounded-2xl bg-gradient-primary text-white group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground tracking-wide">
          {title}
        </h3>
      </div>
    </div>
  );
};

export default FeatureCard;