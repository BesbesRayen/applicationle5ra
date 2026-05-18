/**
 * Real-time Socket.IO client for the mobile app.
 *
 * Connects to the socket-server (Node.js) and listens for article events.
 * Import `useArticleSocket` in any component that needs live article updates.
 *
 * Usage:
 *   const { articles } = useArticleSocket(initialArticles);
 */

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

// Derive socket server URL from API base URL (same host, port 3001)
const deriveSocketUrl = () => {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.hostname}:3001`;
  } catch {
    return "http://localhost:3001";
  }
};

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? deriveSocketUrl();

// ── Article event types ────────────────────────────────────────────────────

export interface ArticleSocketEvent {
  id: number;
  productName: string;
  description: string;
  price: number;
  imageUrl: string;
  boutiqueName: string;
  category: string;
  active: boolean;
  sourceUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Singleton socket ────────────────────────────────────────────────────────

let _socket: Socket | null = null;

const getSocket = (): Socket => {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    _socket.on("connect", () => {
      console.log("[socket] connected to", SOCKET_URL);
    });

    _socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
    });

    _socket.on("connect_error", (err) => {
      console.warn("[socket] connect error:", err.message);
    });
  }
  return _socket;
};

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time article events.
 * Keeps a local copy of articles up-to-date without full reload.
 */
export const useArticleSocket = (initialArticles: ArticleSocketEvent[]) => {
  const [articles, setArticles] = useState<ArticleSocketEvent[]>(initialArticles);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onNew = (article: ArticleSocketEvent) => {
      if (!article?.active) return;
      setArticles((prev) => {
        if (prev.find((a) => a.id === article.id)) return prev;
        return [article, ...prev];
      });
    };

    const onUpdate = (article: ArticleSocketEvent) => {
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, ...article } : a)),
      );
    };

    const onDelete = (data: { id: number }) => {
      setArticles((prev) => prev.filter((a) => a.id !== data.id));
    };

    socket.on("new-article", onNew);
    socket.on("update-article", onUpdate);
    socket.on("delete-article", onDelete);

    return () => {
      socket.off("new-article", onNew);
      socket.off("update-article", onUpdate);
      socket.off("delete-article", onDelete);
    };
  }, []);

  return { articles };
};
