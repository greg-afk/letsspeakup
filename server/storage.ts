
import type { Card, Player, GameState, CardSet, Rating } from "@shared/schema";
import { randomUUID } from "crypto";

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const deckValues: Record<number, string[]> = {
  1: [
    "I don’t think that joke was offensive; people need to lighten up.",
    "We’re all professionals here. Let’s not make a big deal out of minor comments.",
    "Let me explain to you why this is wrong. If you speak up about this, it might make things worse for you in the long term.",
    "Well, we have always done it this way.",
    "Don’t worry, it’s okay! You’ll adjust to our way of doing things soon enough.",
    "Thank you, but that’s not a relevant question for this issue.",
    "That’s not how we do things here; let me explain.",
    "Why are you asking that.",
    "You should know this; I’m sure you’ve done it many times.",
    "There are no questions, right?",
    "You’re overthinking it; it’s not a big deal.",
    "We don’t have time for questions right now.",
    "That’s just how it is, so let’s move on.",
    "Bringing this up could damage your reputation.",
    "I think you’re overreacting. It wasn’t meant that way.",
    "Wow, your English is really good for a foreign speaker.",
    "People just need to stop being so sensitive.",
    "You’re being too emotional about this."
  ],
  2: [
    "The Micromanager: Pays excessive attention to details and struggles to trust the team’s capabilities.",
    "The People Pleaser: Tries to maintain harmony but avoids conflict or challenging authority.",
    "The Inconsistent Manager: Sends mixed signals and changes expectations frequently, creating confusion and uncertainty within the team.",
    "The Devil’s Advocate: Plays the role of a contrarian to challenge groupthink.",
    "The Optimist: Always sees the silver lining and tries to motivate the team."
  ],
  3: [
    "During a team brainstorming session",
    "While training a team member on a new tool or process",
    "While mentoring a junior colleague",
    "When under intense pressure to deliver results",
    "While conducting a performance review"
  ]
};

export function createDeck(deckNumber: number, count: number): Card[] {
  const values = deckValues[deckNumber];
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

export class MemStorage {
  private rooms: Map<string, GameState> = new Map();

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
    if (!room || room.players.length >= room.maxPlayers || room.phase !== "waiting") return false;
    if (room.players.some(p => p.id === playerId)) return false;
    room.players.push({ id: playerId, name: playerName, isConnected: true });
    return true;
  }

  removePlayerFromRoom(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== playerId);
    if (room.players.length === 0) this.rooms.delete(roomCode);
  }

  updatePlayerConnection(roomCode: string, playerId: string, isConnected: boolean): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === playerId);
    if (player) player.isConnected = isConnected;
  }

  startGame(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room || room.players.length < 2 || room.phase !== "waiting") return false;
    room.phase = "selecting";
    room.round = 1;
    room.currentPlayerIndex = 0;
    room.ratings = [];
    this.dealCardsToCurrentPlayer(room);
    return true;
  }

  private dealCardsToCurrentPlayer(room: GameState): void {
    room.activePlayerHand = {
      deck1: createDeck(1, 3),
      deck2: createDeck(2, 1),
      deck3: createDeck(3, 1),
    };
  }

  selectCards(roomCode: string, playerId: string, cards: CardSet, rating: "good" | "bad"): boolean {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "selecting") return false;
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return false;
    room.selectedCards = cards;
    room.activePlayerRating = rating;
    room.phase = "rating";
    room.ratings = [{ playerId: currentPlayer.id, rating }];
    room.activePlayerHand = undefined;
    return true;
  }

  submitRating(roomCode: string, playerId: string, rating: "good" | "bad"): boolean {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "rating") return false;
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer && currentPlayer.id === playerId) return false;
    if (room.ratings.some(r => r.playerId === playerId)) return false;
    room.ratings.push({ playerId, rating });
    if (room.ratings.length === room.players.length) room.phase = "revealing";
    return true;
  }

  nextRound(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "revealing") return false;
    room.ratings = [];
    room.selectedCards = undefined;
    room.activePlayerRating = undefined;
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    if (room.currentPlayerIndex === 0) room.round++;
    room.phase = "selecting";
    this.dealCardsToCurrentPlayer(room);
    return true;
  }

  getRoomByPlayerId(playerId: string): GameState | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.id === playerId)) return room;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
