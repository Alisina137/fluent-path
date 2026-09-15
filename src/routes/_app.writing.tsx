import { createFileRoute } from "@tanstack/react-router";

import { WritingCoachScreen } from "@/components/writing/WritingCoachScreen";

export const Route = createFileRoute("/_app/writing")({
  head: () => ({
    meta: [
      {
        title: "AI Writing Coach - Fluent Path",
      },
      {
        name: "description",
        content:
          "Practice English writing, understand your mistakes, revise your work, and improve with Fluent Path.",
      },
    ],
  }),

  component: WritingPage,
});

function WritingPage() {
  return <WritingCoachScreen />;
}
