
import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import type { GameState, Card as CardType, CardSet } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Copy, Check } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { PlayerList } from "@/components/player-list";
import { RatingPanel } from "@/components/rating-panel";
import { ResultsPanel } from "@/components/results-panel";
import { WaitingRoom } from "@/components/waiting-room";

export default function Game() {
  const [, params] = useRoute("/game/:roomCode");
  const [, setLocation] = useLocation();
  const roomCode = params?.roomCode ?? "";

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>("");
  const [selectedCards, setSelectedCards] = useState<{
    deck1?: CardType;
    deck2?: CardType;
    deck3?: CardType;
  }>({});
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!roomCode) {
      setLocation("/");
      return;
    }

    connectSocket();
    const socket = getSocket();
    setMyPlayerId(socket.id);

    const playerName = "Anonymous";

    socket.emit("join_room", roomCode, playerName, (success: boolean, error?: string) => {
      if (!success) {
        toast({
          variant: "destructive",
          title: "Failed to join room",
          description: error || "Unknown error",
        });
        setLocation("/");
      }
    });

    socket.on("game_state", (state: GameState) => {
      setGameState(state);
    });

    socket.on("error", (message: string) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    });

    socket.on("player_joined", (playerName: string) => {
      toast({
        title: "Player joined",
        description: `${playerName} has joined the game.`,
      });
    });

    socket.on("player_left", (playerName: string) => {
      toast({
        title: "Player left",
        description: `${playerName} has left the game.`,
      });
    });

    return () => {
      socket.off("game_state");
      socket.off("error");
      socket.off("player_joined");
      socket.off("player_left");
      disconnectSocket();
    };
  }, [roomCode, setLocation, toast]);

  const handleLeaveGame = () => {
    setLocation("/");
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast({
      title: "Room code copied!",
      description: "Share this code with your friends to invite them.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardSelect = (card: CardType) => {
    const deckKey = `deck${card.deckNumber}` as keyof typeof selectedCards;
    if (selectedCards[deckKey]?.id === card.id) {
      setSelectedCards((prev) => ({ ...prev, [deckKey]: undefined }));
    } else {
      setSelectedCards((prev) => ({ ...prev, [deckKey]: card }));
    }
  };

  const handleSubmitCards = (rating: "promotes" | "hinders") => {
    if (!selectedCards.deck1 || !selectedCards.deck2 || !selectedCards.deck3) {
      toast({
        variant: "destructive",
        title: "Incomplete selection",
        description: "Please select one card from each deck.",
      });
      return;
    }
    const cardSet: CardSet = {
      deck1Card: selectedCards.deck1,
      deck2Card: selectedCards.deck2,
      deck3Card: selectedCards.deck3,
    };
    const socket = getSocket();
    socket.emit("select_cards", cardSet, rating);
    setSelectedCards({});
  };

  const handleSubmitRating = (rating: "promotes" | "hinders") => {
    const socket = getSocket();
    socket.emit("submit_rating", rating);
  };

  const handleNextRound = () => {
    const socket = getSocket();
    socket.emit("next_round");
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Connecting to game...</p>
        </div>
      </div>
    );
  }


  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const myRating = gameState.ratings.find((r) => r.playerId === myPlayerId);
  const allRatingsSubmitted = gameState.ratings.length === gameState.players.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button
                data-testid="button-leave-game"
                variant="ghost"
                size="icon"
                onClick={handleLeaveGame}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Card Match</h1>
                <p className="text-sm text-muted-foreground">Round {gameState.round}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {gameState.players.length}/{gameState.maxPlayers}
                </Badge>
                <Button
                  data-testid="button-copy-code"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRoomCode}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="font-mono font-semibold">{roomCode}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Waiting Room */}
        {gameState.phase === "waiting" && (
          <WaitingRoom gameState={gameState} myPlayerId={myPlayerId} roomCode={roomCode} />
        )}

        {/* Active Game */}
        {gameState.phase !== "waiting" && (
          <>
            {/* Players Section */}
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Players
                  </span>
                  {currentPlayer && (
                    <Badge variant={isMyTurn ? "default" : "secondary"} className="text-sm">
                      {isMyTurn ? "Your Turn" : `${currentPlayer.name}'s Turn`}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerList
                  players={gameState.players}
                  currentPlayerId={currentPlayer?.id}
                  myPlayerId={myPlayerId}
                />
              </CardContent>
            </Card>

            {/* Card Selection Phase */}
            {gameState.phase === "selecting" && isMyTurn && gameState.activePlayerHand && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Select Your Cards</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose one card from each deck to create your set
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Deck 1 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Statement Cards
                      </Label>
                      {selectedCards.deck1 && (
                        <Badge variant="outline" className="text-xs">Selected</Badge>
                      )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {gameState.activePlayerHand.deck1.map((card) => (
                        <GameCard
                          key={card.id}
                          card={card}
                          isSelected={selectedCards.deck1?.id === card.id}
                          onClick={() => handleCardSelect(card)}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Deck 2 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Role Card
                      </Label>
                      {selectedCards.deck2 && (
                        <Badge variant="outline" className="text-xs">Selected</Badge>
                      )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {gameState.activePlayerHand.deck2.map((card) => (
                        <GameCard
                          key={card.id}
                          card={card}
                          isSelected={selectedCards.deck2?.id === card.id}
                          onClick={() => handleCardSelect(card)}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Deck 3 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Context Card
                      </Label>
                      {selectedCards.deck3 && (
                        <Badge variant="outline" className="text-xs">Selected</Badge>
                      )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {gameState.activePlayerHand.deck3.map((card) => (
                        <GameCard
                          key={card.id}
                          card={card}
                          isSelected={selectedCards.deck3?.id === card.id}
                          onClick={() => handleCardSelect(card)}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <RatingPanel
                    onSubmit={handleSubmitCards}
                    disabled={!selectedCards.deck1 || !selectedCards.deck2 || !selectedCards.deck3}
                    title="Rate your card set"
                  />
                </CardContent>
              </Card>
            )}

            {/* Waiting for Active Player */}
            {gameState.phase === "selecting" && !isMyTurn && (
              <Card className="border-2">
                <CardContent className="py-12 text-center">
                  <div className="animate-pulse space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Waiting for {currentPlayer?.name}...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentPlayer?.name} is selecting their card set
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rating Phase */}
            {gameState.phase === "rating" && gameState.selectedCards && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>
                    {isMyTurn ? "Your Card Set" : `${currentPlayer?.name}'s Card Set`}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isMyTurn 
                      ? "Waiting for others to rate your set..." 
                      : "Rate this card set - does it promote or hinder psychological safety?"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Display Selected Cards */}
                  <div className="flex gap-4 justify-center flex-wrap">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Statement</Label>
                      <GameCard card={gameState.selectedCards.deck1Card} isSelected={false} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Role</Label>
                      <GameCard card={gameState.selectedCards.deck2Card} isSelected={false} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Context</Label>
                      <GameCard card={gameState.selectedCards.deck3Card} isSelected={false} />
                    </div>
                  </div>

                  {!isMyTurn && !myRating && (
                    <>
                      <Separator />
                      <RatingPanel
                        onSubmit={handleSubmitRating}
                        disabled={false}
                        title="Submit your rating"
                      />
                    </>
                  )}

                  {myRating && (
                    <div className="text-center py-4">
                      <Badge variant="outline" className="text-sm">
                       You rated this as: <span>{myRating.rating === "promotes" ? "Promotes" : "Hinders"}</span>
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        Waiting for other players... ({gameState.ratings.length}/{gameState.players.length})
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Results Phase */}
            {gameState.phase === "revealing" && gameState.selectedCards && (
              <ResultsPanel
                gameState={gameState}
                currentPlayer={currentPlayer}
                myPlayerId={myPlayerId}
                onNextRound={handleNextRound}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
