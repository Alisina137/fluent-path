import type {
  WritingDimensionImprovement,
  WritingDimensionScore,
  WritingImprovementClassification,
  WritingImprovementMeasurement,
} from "./types";

interface MeasureWritingImprovementInput {
  beforeOverallScore: number | null;
  afterOverallScore: number | null;
  beforeDimensions: WritingDimensionScore[];
  afterDimensions: WritingDimensionScore[];
}

export function measureWritingImprovement({
  beforeOverallScore,
  afterOverallScore,
  beforeDimensions,
  afterDimensions,
}: MeasureWritingImprovementInput): WritingImprovementMeasurement {
  if (beforeOverallScore === null || afterOverallScore === null) {
    return unavailableMeasurement();
  }

  const dimensions = compareDimensionScores(beforeDimensions, afterDimensions);

  const improvedDimensions = dimensions.filter((dimension) => dimension.difference > 0).length;

  const declinedDimensions = dimensions.filter((dimension) => dimension.difference < 0).length;

  const unchangedDimensions = dimensions.filter((dimension) => dimension.difference === 0).length;

  const overallDifference = afterOverallScore - beforeOverallScore;

  return {
    available: true,

    classification: classifyImprovement(overallDifference, improvedDimensions, declinedDimensions),

    overall: {
      beforeScore: beforeOverallScore,
      afterScore: afterOverallScore,
      difference: overallDifference,
    },

    dimensions,

    strongestImprovement: findStrongestImprovement(dimensions),

    improvedDimensions,
    declinedDimensions,
    unchangedDimensions,
  };
}

function compareDimensionScores(
  before: WritingDimensionScore[],
  after: WritingDimensionScore[],
): WritingDimensionImprovement[] {
  const beforeByDimension = new Map(before.map((score) => [score.dimension, score.score]));

  return after.flatMap((afterScore) => {
    const beforeScore = beforeByDimension.get(afterScore.dimension);

    if (beforeScore === undefined) {
      return [];
    }

    return [
      {
        dimension: afterScore.dimension,
        beforeScore,
        afterScore: afterScore.score,
        difference: afterScore.score - beforeScore,
      },
    ];
  });
}

function findStrongestImprovement(
  dimensions: WritingDimensionImprovement[],
): WritingDimensionImprovement | null {
  const improved = dimensions.filter((dimension) => dimension.difference > 0);

  if (improved.length === 0) {
    return null;
  }

  return improved.reduce((strongest, current) =>
    current.difference > strongest.difference ? current : strongest,
  );
}

function classifyImprovement(
  overallDifference: number,
  improvedDimensions: number,
  declinedDimensions: number,
): WritingImprovementClassification {
  if (overallDifference >= 10 && declinedDimensions === 0) {
    return "strong_improvement";
  }

  if (overallDifference > 0 && declinedDimensions === 0) {
    return "improvement";
  }

  if (improvedDimensions > 0 && declinedDimensions > 0) {
    return "mixed";
  }

  if (overallDifference === 0 && declinedDimensions === 0) {
    return "unchanged";
  }

  if (overallDifference < 0) {
    return "decline";
  }

  return "mixed";
}

function unavailableMeasurement(): WritingImprovementMeasurement {
  return {
    available: false,
    classification: null,
    overall: null,
    dimensions: [],
    strongestImprovement: null,
    improvedDimensions: 0,
    declinedDimensions: 0,
    unchangedDimensions: 0,
  };
}
