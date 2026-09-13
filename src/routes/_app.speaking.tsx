import { createFileRoute } from "@tanstack/react-router";

import { ConversationScreen } from "@/components/speaking/ConversationScreen";

export const Route = createFileRoute("/_app/speaking")({
  head: () => ({
    meta: [
      {
        title: "AI Speaking Coach — Fluent Path",
      },
      {
        name: "description",
        content: "Practice English conversations with the Fluent Path AI Speaking Coach.",
      },
    ],
  }),

  component: SpeakingPage,
});

function SpeakingPage() {
  return <ConversationScreen />;
}
