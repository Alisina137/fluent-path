export interface WritingSentence {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
}

export function splitWritingIntoSentences(learnerText: string): WritingSentence[] {
  if (!learnerText) {
    return [];
  }

  const sentences: WritingSentence[] = [];

  const segmenter = createSentenceSegmenter();

  if (segmenter) {
    for (const segment of segmenter.segment(learnerText)) {
      addSentence(sentences, learnerText, segment.segment, segment.index);
    }

    return sentences;
  }

  return splitWritingIntoSentencesFallback(learnerText);
}

function createSentenceSegmenter(): Intl.Segmenter | null {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") {
    return null;
  }

  return new Intl.Segmenter("en", {
    granularity: "sentence",
  });
}

function splitWritingIntoSentencesFallback(learnerText: string): WritingSentence[] {
  const sentences: WritingSentence[] = [];

  const pattern = /[^.!?\r\n]+(?:[.!?]+|(?=\r?\n)|$)/g;

  for (const match of learnerText.matchAll(pattern)) {
    if (match.index === undefined) {
      continue;
    }

    addSentence(sentences, learnerText, match[0], match.index);
  }

  return sentences;
}

function addSentence(
  sentences: WritingSentence[],
  learnerText: string,
  rawText: string,
  rawStartOffset: number,
): void {
  const leadingWhitespace = rawText.length - rawText.trimStart().length;

  const trailingWhitespace = rawText.length - rawText.trimEnd().length;

  const startOffset = rawStartOffset + leadingWhitespace;

  const endOffset = rawStartOffset + rawText.length - trailingWhitespace;

  if (startOffset >= endOffset) {
    return;
  }

  const text = learnerText.slice(startOffset, endOffset);

  sentences.push({
    id: `writing-sentence:${startOffset}:${endOffset}`,
    text,
    startOffset,
    endOffset,
  });
}
