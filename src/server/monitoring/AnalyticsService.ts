/**
 * Analytics Service
 * 
 * Tracks user engagement, game statistics, and behavioral analytics
 * while respecting privacy and providing actionable insights.
 */

import { loadConfig } from '../../shared/config/environment';

export interface UserEvent {
  eventId: string;
  userId?: string;
  sessionId?: string;
  eventType: string;
  eventName: string;
  timestamp: Date;
  properties: Record<string, any>;
  context: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    environment: string;
  };
}

export interface GameAnalytics {
  gameId: string;
  creatorId: string;
  mapKey: string;
  objectKey: string;
  createdAt: Date;
  stats: {
    totalGuesses: number;
    uniqueGuessers: number;
    correctGuesses: n