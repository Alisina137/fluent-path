import { createFileRoute } from "@tanstack/react-router";
import { VocabularyBuilderScreen } from "@/components/vocabulary/VocabularyBuilderScreen";

export const Route = createFileRoute("/_app/vocabulary")({
  head: () => ({ meta: [{ title: "Vocabulary Builder - Fluent Path" }, { name: "description", content: "Learn useful English vocabulary with native-language translations and spaced repetition." }] }),
  component: VocabularyPage,
});

function VocabularyPage() { return <VocabularyBuilderScreen />; }
