
import type { Card } from "@shared/schema";
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

// Custom card values for each deck
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

// Helper function to create a deck of cards
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
export const storage = new MemStorage();
