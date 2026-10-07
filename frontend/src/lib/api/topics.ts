import { apiClient } from "./client";
import { TopicSummary, TopicDetail, TopicDifficulty } from "./types";

export interface GetTopicsParams {
  difficulty?: TopicDifficulty;
  search?: string;
  sortBy?: "order" | "title";
}

export async function fetchTopics(params?: GetTopicsParams): Promise<TopicSummary[]> {
  return apiClient.get<TopicSummary[]>("topics", {
    params: {
      difficulty: params?.difficulty,
      search: params?.search,
      sortBy: params?.sortBy,
    },
  });
}

export async function fetchTopicBySlug(slug: string): Promise<TopicDetail> {
  return apiClient.get<TopicDetail>(`topics/${slug}`);
}

export async function searchTopics(query: string, difficulty?: TopicDifficulty): Promise<TopicSummary[]> {
  return apiClient.get<TopicSummary[]>("topics/search", {
    params: {
      q: query,
      difficulty,
    },
  });
}
