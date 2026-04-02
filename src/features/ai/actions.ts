"use server";

import { aiApi, ApiError } from "@/shared/lib/api/client";

export async function prioritizeBoardAction(boardId: string) {
  try {
    const result = await aiApi.prioritize(boardId);
    return { result };
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Failed to prioritize board";
    return { error: message };
  }
}

export async function decomposeCardAction(
  cardId: string,
  opts: { clarificationAnswer?: string; createCards?: boolean } = {},
) {
  try {
    const result = await aiApi.decompose(cardId, opts);
    return { result };
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Failed to decompose card";
    return { error: message };
  }
}

export async function generateStandupAction(boardId: string) {
  try {
    const result = await aiApi.standup(boardId);
    return { result };
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Failed to generate standup";
    return { error: message };
  }
}

export async function cardChatAction(
  cardId: string,
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
) {
  try {
    const result = await aiApi.cardChat(cardId, message, history);
    return { result };
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Failed to send message";
    return { error: message };
  }
}
