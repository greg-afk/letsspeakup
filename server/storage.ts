import type { Card, Player, GameState, CardSet, Rating } from "@shared/schema";
import { randomUUID } from "crypto";

// Helper function to generate a random room code
export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper function to create a deck of cards
export function createDeck(deckNumber: number, count: number): Card[] {
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const cards: Card[] = [];
  
  for (let i = 0; i < count; i++) {
    cards.push({
      id: randomUUID(),
      deckNumber,
      value: values[i % values.length],
    });
  }
  
  return cards;
}

// Game room management
export interface IStorage {
  createRoom(hostPlayerId: string, hostPlayerName: string): string;
  getRoom(roomCode: string): GameState | undefined;
  addPlayerToRoom(roomCode: string, playerId: string, playerName: string): boolean;
  removePlayerFromRoom(roomCode: string, playerId: string): void;
  updatePlayerConnection(roomCode: string, playerId: string, isConnected: boolean): void;
  startGame(roomCode: string): boolean;
  selectCards(roomCode: string, playerId: string, cards: CardSet, rating: "good" | "bad"): boolean;
  submitRating(roomCode: string, playerId: string, rating: "good" | "bad"): boolean;
  nextRound(roomCode: string): boolean;
  getRoomByPlayerId(playerId: string): GameState | undefined;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, GameState>;

  constructor() {
    this.rooms = new Map();
  }

  createRoom(hostPlayerId: string, hostPlayerName: string): string {
    const roomCode = generateRoomCode();
    
    const hostPlayer: Player = {
      id: hostPlayerId,
      name: hostPlayerName,
      isConnected: true,
    };

    const gameState: GameState = {
      roomCode,
      phase: "waiting",
      players: [hostPlayer],
      currentPlayerIndex: 0,
      ratings: [],
      round: 0,
      maxPlayers: 3,
    };

    this.rooms.set(roomCode, gameState);
    return roomCode;
  }

  getRoom(roomCode: string): GameState | undefined {
    return this.rooms.get(roomCode);
  }

  addPlayerToRoom(roomCode: string, playerId: string, playerName: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    // Check if room is full
    if (room.players.length >= room.maxPlayers) return false;

    // Check if game already started
    if (room.phase !== "waiting") return false;

    // Check if player already in room
    if (room.players.some(p => p.id === playerId)) return false;

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      isConnected: true,
    };

    room.players.push(newPlayer);
    return true;
  }

  removePlayerFromRoom(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);

    // If no players left, delete the room
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
    }
  }

  updatePlayerConnection(roomCode: string, playerId: string, isConnected: boolean): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = isConnected;
    }
  }

  startGame(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    // Need at least 2 players
    if (room.players.length < 2) return false;

    // Already started
    if (room.phase !== "waiting") return false;

    // Initialize game
    room.phase = "selecting";
    room.round = 1;
    room.currentPlayerIndex = 0;
    room.ratings = [];

    // Deal cards to the first player
    this.dealCardsToCurrentPlayer(room);

    return true;
  }

  private dealCardsToCurrentPlayer(room: GameState): void {
    // Create a hand for the current player: 3 from deck 1, 1 from deck 2, 1 from deck 3
    room.activePlayerHand = {
      deck1: createDeck(1, 3),
      deck2: createDeck(2, 1),
      deck3: createDeck(3, 1),
    };
  }

  selectCards(roomCode: string, playerId: string, cards: CardSet, rating: "good" | "bad"): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    // Must be in selecting phase
    if (room.phase !== "selecting") return false;

    // Must be the current player
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return false;

    // Store the selected cards and rating
    room.selectedCards = cards;
    room.activePlayerRating = rating;

    // Move to rating phase
    room.phase = "rating";

    // Add the active player's rating (they already rated it)
    room.ratings = [{
      playerId: currentPlayer.id,
      rating: rating,
    }];

    // Clear the active player's hand
    room.activePlayerHand = undefined;

    return true;
  }

  submitRating(roomCode: string, playerId: string, rating: "good" | "bad"): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    // Must be in rating phase
    if (room.phase !== "rating") return false;

    // Can't be the current player (they already rated)
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer && currentPlayer.id === playerId) return false;

    // Check if already rated
    if (room.ratings.some(r => r.playerId === playerId)) return false;

    // Add rating
    room.ratings.push({
      playerId,
      rating,
    });

    // Check if all players have rated
    if (room.ratings.length === room.players.length) {
      room.phase = "revealing";
    }

    return true;
  }

  nextRound(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    // If in waiting phase, start the game
    if (room.phase === "waiting") {
      return this.startGame(roomCode);
    }

    // Must be in revealing phase
    if (room.phase !== "revealing") return false;

    // Clear previous round data
    room.ratings = [];
    room.selectedCards = undefined;
    room.activePlayerRating = undefined;

    // Move to next player
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;

    // Increment round if we've cycled through all players
    if (room.currentPlayerIndex === 0) {
      room.round++;
    }

    // Move to selecting phase
    room.phase = "selecting";

    // Deal cards to the new current player
    this.dealCardsToCurrentPlayer(room);

    return true;
  }

  getRoomByPlayerId(playerId: string): GameState | undefined {
    for (const room of Array.from(this.rooms.values())) {
      if (room.players.some((p: Player) => p.id === playerId)) {
        return room;
      }
    }
    return undefined;
  }
}

export const storage = new MemStorage();
