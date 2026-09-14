import { createFileRoute } from "@tanstack/react-router";

import { ConversationScreen } from "@/components/speaking/ConversationScreen";
import { SpeakingProgressDashboard } from "@/components/speaking/SpeakingProgressDashboard";

export const Route = createFileRoute("/_app/speaking")({
  head: () => ({
    meta: [
      {
        title: "AI Speaking Coach - Fluent Path",
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
  return (
    <div className="space-y-10">
      <SpeakingProgressDashboard />

      <section aria-labelledby="speaking-practice-heading" className="space-y-4">
        <div>
          <h1 id="speaking-practice-heading" className="text-xl font-semibold tracking-tight">
            Speaking Practice
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Continue your AI conversation and request feedback on your English.
          </p>
        </div>

        <ConversationScreen />
      </section>
    </div>
  );
}
