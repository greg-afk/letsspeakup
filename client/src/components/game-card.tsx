import type { Card } from "@shared/schema";
import { cn } from "@/lib/utils";

interface GameCardProps {
  card: Card;
  isSelected: boolean;
  onClick?: () => void;
}

export function GameCard({ card, isSelected, onClick }: GameCardProps) {
  const deckColors = {
    1: "from-blue-500/10 to-blue-600/20 border-blue-500/30",
    2: "from-purple-500/10 to-purple-600/20 border-purple-500/30",
    3: "from-amber-500/10 to-amber-600/20 border-amber-500/30",
  };

  const deckTextColors = {
    1: "text-blue-600 dark:text-blue-400",
    2: "text-purple-600 dark:text-purple-400",
    3: "text-amber-600 dark:text-amber-400",
  };

  return (
    <button
      data-testid={`card-${card.id}`}
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group relative w-24 md:w-32 aspect-[2/3] rounded-lg border-2 transition-all",
        "bg-gradient-to-br shadow-lg",
        deckColors[card.deckNumber as keyof typeof deckColors],
        onClick && "cursor-pointer hover-elevate active-elevate-2",
        isSelected && "ring-4 ring-primary ring-offset-2 ring-offset-background",
        !onClick && "opacity-90"
      )}
    >
      {/* Deck Number Badge */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
        {isSelected && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
            ✓
          </span>
        )}
      </div>

      {/* Card Value */}
<div className="absolute inset-0 flex items-center justify-center p-2">
  <div className={cn(
    "text-xs md:text-sm font-medium text-center overflow-y-auto max-h-full w-full",
    deckTextColors[card.deckNumber as keyof typeof deckTextColors]
  )}>
    {card.value}
  </div>
</div>

      
    </button>
  );
}
