import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface RatingPanelProps {
  onSubmit: (rating: "good" | "bad") => void;
  disabled: boolean;
  title: string;
}

export function RatingPanel({ onSubmit, disabled, title }: RatingPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-center">{title}</p>
      <div className="grid grid-cols-2 gap-4">
        <Button
          data-testid="button-rate-good"
          onClick={() => onSubmit("good")}
          disabled={disabled}
          size="lg"
          className="gap-2 bg-green-600 text-white border-2 border-green-700"
        >
          <ThumbsUp className="w-5 h-5" />
          Good
        </Button>
        <Button
          data-testid="button-rate-bad"
          onClick={() => onSubmit("bad")}
          disabled={disabled}
          size="lg"
          className="gap-2 bg-red-600 text-white border-2 border-red-700"
        >
          <ThumbsDown className="w-5 h-5" />
          Bad
        </Button>
      </div>
    </div>
  );
}
