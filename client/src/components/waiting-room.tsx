import type { GameState } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Play } from "lucide-react";
import { PlayerList } from "./player-list";
import { getSocket } from "@/lib/socket";

interface WaitingRoomProps {
  gameState: GameState;
  myPlayerId: string;
  roomCode: string;
}

export function WaitingRoom({ gameState, myPlayerId, roomCode }: WaitingRoomProps) {
  const isHost = gameState.players[0]?.id === myPlayerId;
  const canStart = gameState.players.length >= 2 && gameState.players.length <= 3;

  const handleStartGame = () => {
    const socket = getSocket();
    socket.emit("next_round");
  };

  return (
    <div className="space-y-6">
      {/* Waiting Room Header */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Waiting Room</h2>
            <p className="text-muted-foreground">
              {gameState.players.length < 2 
                ? "Waiting for more players to join..."
                : `${gameState.players.length}/${gameState.maxPlayers} players ready`}
            </p>
          </div>
          {isHost && canStart && (
            <Button
              data-testid="button-start-game"
              onClick={handleStartGame}
              size="lg"
              className="gap-2"
            >
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          )}
          {isHost && !canStart && (
            <p className="text-sm text-muted-foreground">
              Need at least 2 players to start
            </p>
          )}
          {!isHost && (
            <p className="text-sm text-muted-foreground">
              Waiting for the host to start the game...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Players List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Players ({gameState.players.length}/{gameState.maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PlayerList
            players={gameState.players}
            myPlayerId={myPlayerId}
          />
        </CardContent>
      </Card>

      {/* Game Info */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg">Ready to Play?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Each player will receive 5 cards: 3 from Deck 1, 1 from Deck 2, and 1 from Deck 3.
          </p>
          <p>
            On your turn, select one card from each deck to create a set, then rate it as "good" or "bad".
          </p>
          <p>
            Other players will try to match your rating. See who knows you best!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
