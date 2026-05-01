import { Rating } from "../../my-trip/domain/Trip.types";

export interface RatingOption {
  value: Rating;
  label: string;
  emoji: string;
}

export const RATING_OPTIONS: RatingOption[] = [
  { value: "DISLIKED", label: "Disliked", emoji: "😞" },
  { value: "BELOW_AVERAGE", label: "Below Average", emoji: "😕" },
  { value: "AVERAGE", label: "Average", emoji: "😐" },
  { value: "VERY_GOOD", label: "Very Good", emoji: "😊" },
  { value: "EXCELLENT", label: "Excellent", emoji: "🤩" }
];

export interface RatingInfo {
  label: string;
  emoji: string;
  score: number;
}

export const RATING_OPTION_BY_VALUE: Record<Rating, RatingInfo> =
  RATING_OPTIONS.reduce(
    (acc, opt, idx) => {
      acc[opt.value] = { label: opt.label, emoji: opt.emoji, score: idx + 1 };
      return acc;
    },
    {} as Record<Rating, RatingInfo>
  );
