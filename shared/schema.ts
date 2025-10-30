import { z } from "zod";

// Card representation in the game
export const cardSchema = z.object({
  id: z.string(),
  deckNumber: z.number().min(1).max(3), // Deck 1, 2, or 3
  value: z.string(), // Card display value (e.g., "A", "2", "3", etc.)
});

export type Card = z.infer<typeof cardSchema>;

// Player in the game
export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  isConnected: z.boolean(),
});

export type Player = z.infer<typeof playerSchema>;

// Rating submitted by a player
export const ratingSchema = z.object({
  playerId: z.string(),
  rating: z.enum(["good", "bad"]),
});

export type Rating = z.infer<typeof ratingSchema>;

// Card set played by the active player
export const cardSetSchema = z.object({
  deck1Card: cardSchema,
  deck2Card: cardSchema,
  deck3Card: cardSchema,
});

export type CardSet = z.infer<typeof cardSetSchema>;

// Game phases
export type GamePhase = 
  | "waiting"    // Waiting for players to join
  | "selecting"  // Active player is selecting cards
  | "rating"     // Players are rating the card set
  | "revealing"  // Showing the results
  | "ended";     // Game has ended

// Complete game state
export const gameStateSchema = z.object({
  roomCode: z.string(),
  phase: z.string() as z.ZodType<GamePhase>,
  players: z.array(playerSchema),
  currentPlayerIndex: z.number(),
  activePlayerHand: z.object({
    deck1: z.array(cardSchema),
    deck2: z.array(cardSchema),
    deck3: z.array(cardSchema),
  }).optional(),
  selectedCards: cardSetSchema.optional(),
  activePlayerRating: z.enum(["good", "bad"]).optional(),
  ratings: z.array(ratingSchema),
  round: z.number(),
  maxPlayers: z.number(),
});

export type GameState = z.infer<typeof gameStateSchema>;

// WebSocket message types
export const joinRoomMessageSchema = z.object({
  type: z.literal("join_room"),
  roomCode: z.string(),
  playerName: z.string(),
});

export const selectCardsMessageSchema = z.object({
  type: z.literal("select_cards"),
  cards: cardSetSchema,
  rating: z.enum(["good", "bad"]),
});

export const submitRatingMessageSchema = z.object({
  type: z.literal("submit_rating"),
  rating: z.enum(["good", "bad"]),
});

export const nextRoundMessageSchema = z.object({
  type: z.literal("next_round"),
});

export const createRoomMessageSchema = z.object({
  type: z.literal("create_room"),
  playerName: z.string(),
});

export type JoinRoomMessage = z.infer<typeof joinRoomMessageSchema>;
export type SelectCardsMessage = z.infer<typeof selectCardsMessageSchema>;
export type SubmitRatingMessage = z.infer<typeof submitRatingMessageSchema>;
export type NextRoundMessage = z.infer<typeof nextRoundMessageSchema>;
export type CreateRoomMessage = z.infer<typeof createRoomMessageSchema>;

export type ClientMessage = 
  | JoinRoomMessage 
  | SelectCardsMessage 
  | SubmitRatingMessage 
  | NextRoundMessage
  | CreateRoomMessage;

// Server-to-client events
export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  error: (message: string) => void;
  player_joined: (playerName: string) => void;
  player_left: (playerName: string) => void;
  room_created: (roomCode: string) => void;
}

// Client-to-server events
export interface ClientToServerEvents {
  create_room: (playerName: string, callback: (roomCode: string) => void) => void;
  join_room: (roomCode: string, playerName: string, callback: (success: boolean, error?: string) => void) => void;
  select_cards: (cards: CardSet, rating: "good" | "bad") => void;
  submit_rating: (rating: "good" | "bad") => void;
  next_round: () => void;
}
