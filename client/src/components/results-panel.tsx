import type { GameState, Player } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, ChevronRight } from "lucide-react";
import { GameCard } from "./game-card";
import { cn } from "@/lib/utils";

interface ResultsPanelProps {
  gameState: GameState;
  currentPlayer: Player | undefined;
  myPlayerId: string;
  onNextRound: () => void;
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function ResultsPanel({ gameState, currentPlayer, myPlayerId, onNextRound }: ResultsPanelProps) {
  const isMyTurn = currentPlayer?.id === myPlayerId;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap justify-between">
          <span>Round Results</span>
          <Badge variant="outline" className="text-sm">
            {currentPlayer?.name}'s rating: 
            <span className={cn(
              "ml-1 font-semibold capitalize",
              gameState.activePlayerRating === "good" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {gameState.activePlayerRating}
            </span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Card Set Display */}
        {gameState.selectedCards && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {currentPlayer?.name}'s selected card set:
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground text-center">Deck 1</Label>
                <GameCard card={gameState.selectedCards.deck1Card} isSelected={false} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground text-center">Deck 2</Label>
                <GameCard card={gameState.selectedCards.deck2Card} isSelected={false} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground text-center">Deck 3</Label>
                <GameCard card={gameState.selectedCards.deck3Card} isSelected={false} />
              </div>
            </div>
          </div>
        )}

        {/* Ratings Grid */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Player Ratings:</p>
          <div className="grid gap-3 md:grid-cols-2">
            {gameState.players.map((player) => {
              const playerRating = gameState.ratings.find((r) => r.playerId === player.id);
              const isActivePlayer = player.id === currentPlayer?.id;
              const matchedActivePlayer = !isActivePlayer && 
                playerRating?.rating === gameState.activePlayerRating;

              return (
                <div
                  key={player.id}
                  data-testid={`result-player-${player.id}`}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                    matchedActivePlayer && "bg-green-500/5 border-green-500/30",
                    !matchedActivePlayer && "bg-card border-card-border"
                  )}
                >
                  <Avatar className="w-10 h-10 border-2">
                    <AvatarFallback className="font-semibold">
                      {player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {player.name}
                      {player.id === myPlayerId && (
                        <span className="text-muted-foreground ml-1">(You)</span>
                      )}
                    </p>
                    {playerRating && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs capitalize",
                            playerRating.rating === "good" 
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                              : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                          )}
                        >
                          {playerRating.rating}
                        </Badge>
                        {matchedActivePlayer && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Check className="w-3 h-3" />
                            Match!
                          </Badge>
                        )}
                        {!isActivePlayer && !matchedActivePlayer && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <X className="w-3 h-3" />
                            No match
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Round Button */}
        {isMyTurn && (
          <div className="pt-4">
            <Button
              data-testid="button-next-round"
              onClick={onNextRound}
              size="lg"
              className="w-full gap-2"
            >
              Next Round
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {!isMyTurn && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Waiting for {currentPlayer?.name} to start the next round...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
