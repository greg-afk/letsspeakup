import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { storage } from "./storage";
import type { ServerToClientEvents, ClientToServerEvents, CardSet } from "@shared/schema";

// Type-safe Socket.IO server
type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const io: TypedServer = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  function emitGameState(roomCode: string): void {
    const gameState = storage.getRoom(roomCode);
    if (gameState) {
      io.to(roomCode).emit("game_state", gameState);
    }
  }

  io.on("connection", (socket: TypedSocket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("create_room", (playerName: string, callback: (roomCode: string) => void) => {
      try {
        const roomCode = storage.createRoom(socket.id, playerName);
        socket.join(roomCode);
        console.log(`[Socket.IO] Room created: ${roomCode} by ${playerName}`);
        callback(roomCode);
        emitGameState(roomCode);
      } catch (error) {
        console.error("[Socket.IO] Error creating room:", error);
        socket.emit("error", "Failed to create room");
      }
    });

  
socket.on("join_room", (roomCode, playerName, callback) => {
  try {
    const room = storage.getRoom(roomCode);
    if (!room) return callback(false, "Room not found");

    // 1) Join the Socket.IO room so this socket receives room broadcasts
    socket.join(roomCode);

    // 2) Add to game state (players only)
    if (playerName !== "Facilitator") {
      const success = storage.addPlayerToRoom(roomCode, socket.id, playerName);
      if (!success) {
        // Avoid ghost membership if we joined above
        socket.leave(roomCode);
        return callback(false, "Unable to join room. Room may be full or game already started.");
      }
      socket.to(roomCode).emit("player_joined", playerName);
    }

    // 3) Acknowledge + push fresh snapshot (the joiner now receives room broadcasts)
    callback(true);
    emitGameState(roomCode);
  } catch (error) {
    callback(false, "An error occurred while joining the room");
  }
});

    socket.on("start_game", () => {
      try {
        const gameState = storage.getRoomByPlayerId(socket.id);
        if (!gameState) {
          socket.emit("error", "You are not in a game");
          return;
        }

        const success = storage.startGame(gameState.roomCode);
        if (!success) {
          socket.emit("error", "Failed to start game. Make sure there are enough players and the game hasn't already started.");
          return;
        }

        console.log(`[Socket.IO] Game started in room ${gameState.roomCode}`);
        emitGameState(gameState.roomCode);
      } catch (error) {
        console.error("[Socket.IO] Error starting game:", error);
        socket.emit("error", "An error occurred while starting the game");
      }
    });

    socket.on("select_cards", (cards: CardSet, rating: "promotes" | "hinders") => {
      try {
        const gameState = storage.getRoomByPlayerId(socket.id);
        if (!gameState) {
          socket.emit("error", "You are not in a game");
          return;
        }

        const success = storage.selectCards(gameState.roomCode, socket.id, cards, rating);
        if (!success) {
          socket.emit("error", "Failed to select cards. Make sure it's your turn.");
          return;
        }

        console.log(`[Socket.IO] Player ${socket.id} selected cards in room ${gameState.roomCode}`);
        emitGameState(gameState.roomCode);
      } catch (error) {
        console.error("[Socket.IO] Error selecting cards:", error);
        socket.emit("error", "An error occurred while selecting cards");
      }
    });

    socket.on("submit_rating", (rating: "promotes" | "hinders") => {
      try {
        const gameState = storage.getRoomByPlayerId(socket.id);
        if (!gameState) {
          socket.emit("error", "You are not in a game");
          return;
        }

        const success = storage.submitRating(gameState.roomCode, socket.id, rating);
        if (!success) {
          socket.emit("error", "Failed to submit rating");
          return;
        }

        console.log(`[Socket.IO] Player ${socket.id} submitted rating in room ${gameState.roomCode}`);
        emitGameState(gameState.roomCode);
      } catch (error) {
        console.error("[Socket.IO] Error submitting rating:", error);
        socket.emit("error", "An error occurred while submitting rating");
      }
    });

    socket.on("next_round", () => {
      try {
        const gameState = storage.getRoomByPlayerId(socket.id);
        if (!gameState) {
          socket.emit("error", "You are not in a game");
          return;
        }

        const success = storage.nextRound(gameState.roomCode);
        if (!success) {
          socket.emit("error", "Failed to start next round");
          return;
        }

        console.log(`[Socket.IO] Next round started in room ${gameState.roomCode}`);
        emitGameState(gameState.roomCode);
      } catch (error) {
        console.error("[Socket.IO] Error starting next round:", error);
        socket.emit("error", "An error occurred while starting next round");
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      try {
        const gameState = storage.getRoomByPlayerId(socket.id);
        if (gameState) {
          const player = gameState.players.find(p => p.id === socket.id);
          if (player) {
            console.log(`[Socket.IO] Disconnecting player: ${player.name} from room ${gameState.roomCode}`);
            storage.updatePlayerConnection(gameState.roomCode, socket.id, false);
            socket.to(gameState.roomCode).emit("player_left", player.name);
            emitGameState(gameState.roomCode);
          }
        }
      } catch (error) {
        console.error("[Socket.IO] Error handling disconnect:", error);
      }
    });
  });

  return httpServer;
}
