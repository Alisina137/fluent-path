import { desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  speakingFeedbackEvaluations,
  speakingMessages,
  speakingSessions,
  type SpeakingFeedbackSkill,
  type SpeakingSessionStatus,
} from "@/db/schema";

import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export type SpeakingSessionHistorySkillScores = {
  grammar: number | null;
  vocabulary: number | null;
  fluency: number | null;
};

export type SpeakingSessionHistoryItem = {
  id: string;
  status: SpeakingSessionStatus;

  startedAt: Date;
  lastActivityAt: Date;

  completedAt: Date | null;
  abandonedAt: Date | null;
  failedAt: Date | null;

  durationMs: number;

  messageCount: number;
  learnerMessageCount: number;
  coachMessageCount: number;

  evaluatedMessageCount: number;
  feedbackEvaluationCount: number;

  skillScores: SpeakingSessionHistorySkillScores;
  overallFeedbackScore: number | null;
};

export type SpeakingSessionHistoryResult = {
  sessions: SpeakingSessionHistoryItem[];
  totalSessions: number;
};

type MessageSummary = {
  total: number;
  learner: number;
  coach: number;
};

type SkillAccumulator = {
  total: number;
  count: number;
};

type SessionFeedbackSummary = {
  evaluatedMessageIds: Set<string>;
  evaluationCount: number;
  skills: Record<SpeakingFeedbackSkill, SkillAccumulator>;
};

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 100;

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizeLimit(limit?: number): number {
  if (limit === undefined) {
    return DEFAULT_HISTORY_LIMIT;
  }

  if (!Number.isInteger(limit)) {
    return DEFAULT_HISTORY_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_HISTORY_LIMIT);
}

function createMessageSummary(): MessageSummary {
  return {
    total: 0,
    learner: 0,
    coach: 0,
  };
}

function createSkillAccumulator(): SkillAccumulator {
  return {
    total: 0,
    count: 0,
  };
}

function createFeedbackSummary(): SessionFeedbackSummary {
  return {
    evaluatedMessageIds: new Set<string>(),
    evaluationCount: 0,

    skills: {
      grammar: createSkillAccumulator(),
      vocabulary: createSkillAccumulator(),
      fluency: createSkillAccumulator(),
    },
  };
}

function averageSkill(accumulator: SkillAccumulator): number | null {
  if (accumulator.count === 0) {
    return null;
  }

  return roundScore(accumulator.total / accumulator.count);
}

function calculateOverallFeedbackScore(scores: SpeakingSessionHistorySkillScores): number | null {
  const available = [scores.grammar, scores.vocabulary, scores.fluency].filter(
    (score): score is number => score !== null,
  );

  if (available.length === 0) {
    return null;
  }

  return roundScore(available.reduce((sum, score) => sum + score, 0) / available.length);
}

export async function getSpeakingSessionHistory(
  userId: string,
  options?: {
    limit?: number;
  },
): Promise<SpeakingSessionHistoryResult> {
  await requireServerModuleAccess(userId, MODULE_IDS.speaking);

  const db = getDb();

  const limit = normalizeLimit(options?.limit);

  const sessions = await db
    .select()
    .from(speakingSessions)
    .where(eq(speakingSessions.userId, userId))
    .orderBy(desc(speakingSessions.startedAt))
    .limit(limit);

  if (sessions.length === 0) {
    return {
      sessions: [],
      totalSessions: 0,
    };
  }

  const sessionIds = sessions.map((session) => session.id);

  const messages = await db
    .select({
      id: speakingMessages.id,
      sessionId: speakingMessages.sessionId,
      role: speakingMessages.role,
    })
    .from(speakingMessages)
    .where(inArray(speakingMessages.sessionId, sessionIds));

  const messageIds = messages.map((message) => message.id);

  const messageSessionMap = new Map<string, string>();

  const messageSummaries = new Map<string, MessageSummary>();

  for (const message of messages) {
    messageSessionMap.set(message.id, message.sessionId);

    const summary = messageSummaries.get(message.sessionId) ?? createMessageSummary();

    summary.total += 1;

    if (message.role === "user") {
      summary.learner += 1;
    }

    if (message.role === "assistant") {
      summary.coach += 1;
    }

    messageSummaries.set(message.sessionId, summary);
  }

  const feedbackRows =
    messageIds.length > 0
      ? await db
          .select({
            messageId: speakingFeedbackEvaluations.messageId,

            skill: speakingFeedbackEvaluations.skill,

            score: speakingFeedbackEvaluations.score,
          })
          .from(speakingFeedbackEvaluations)
          .where(inArray(speakingFeedbackEvaluations.messageId, messageIds))
      : [];

  const feedbackSummaries = new Map<string, SessionFeedbackSummary>();

  for (const feedback of feedbackRows) {
    const sessionId = messageSessionMap.get(feedback.messageId);

    if (!sessionId) {
      continue;
    }

    const summary = feedbackSummaries.get(sessionId) ?? createFeedbackSummary();

    summary.evaluationCount += 1;

    summary.evaluatedMessageIds.add(feedback.messageId);

    const skill = summary.skills[feedback.skill];

    skill.total += feedback.score;
    skill.count += 1;

    feedbackSummaries.set(sessionId, summary);
  }

  const history = sessions.map((session): SpeakingSessionHistoryItem => {
    const messageSummary = messageSummaries.get(session.id) ?? createMessageSummary();

    const feedbackSummary = feedbackSummaries.get(session.id) ?? createFeedbackSummary();

    const skillScores: SpeakingSessionHistorySkillScores = {
      grammar: averageSkill(feedbackSummary.skills.grammar),

      vocabulary: averageSkill(feedbackSummary.skills.vocabulary),

      fluency: averageSkill(feedbackSummary.skills.fluency),
    };

    return {
      id: session.id,

      status: session.status,

      startedAt: session.startedAt,

      lastActivityAt: session.lastActivityAt,

      completedAt: session.completedAt,

      abandonedAt: session.abandonedAt,

      failedAt: session.failedAt,

      durationMs: session.durationMs,

      messageCount: messageSummary.total,

      learnerMessageCount: messageSummary.learner,

      coachMessageCount: messageSummary.coach,

      evaluatedMessageCount: feedbackSummary.evaluatedMessageIds.size,

      feedbackEvaluationCount: feedbackSummary.evaluationCount,

      skillScores,

      overallFeedbackScore: calculateOverallFeedbackScore(skillScores),
    };
  });

  return {
    sessions: history,
    totalSessions: history.length,
  };
}
