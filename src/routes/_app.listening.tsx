import { createFileRoute } from "@tanstack/react-router";

import { ListeningLabScreen } from "@/components/listening/ListeningLabScreen";

export const Route = createFileRoute("/_app/listening")({
  head: () => ({
    meta: [
      { title: "Listening Lab - Fluent Path" },
      {
        name: "description",
        content: "Practice English listening with comprehension, dictation, shadowing and adjustable playback speed.",
      },
    ],
  }),
  component: ListeningLabPage,
});

function ListeningLabPage() {
  return <ListeningLabScreen />;
}
