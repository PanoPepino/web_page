import type { CSSProperties } from "react";

export type QuestionBubbleData = {
  id: number;
  left: string;
  top: string;
  dx: string;
  dy: string;
  animated: boolean;
};

export function QuestionBubble({ bubble }: { bubble: QuestionBubbleData }) {
  return (
    <span
      key={bubble.id}
      aria-hidden="true"
      className={`question-bubble${bubble.animated ? " question-bubble--animated" : ""}`}
      style={
        {
          "--bubble-left": bubble.left,
          "--bubble-top": bubble.top,
          "--bubble-dx": bubble.dx,
          "--bubble-dy": bubble.dy,
        } as CSSProperties
      }
    />
  );
}
