import { Type } from "@google/genai";

export interface User {
  id: string;
  username: string;
  picture?: string;
  credits: number;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  prompt: string;
  timestamp: number;
}

export interface UserStats {
  credits: number;
  imagesGenerated: number;
  videosGenerated: number;
}

export const INITIAL_CREDITS = 50;
