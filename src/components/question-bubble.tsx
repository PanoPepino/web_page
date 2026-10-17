import type { CSSProperties } from "react";

export type BubbleLane = "left" | "right";
export type QuestionBubbleData = { id: number; left: string; top: string; dx: string; dy: string; animated: boolean };

export function makeQuestionBubble(id: number, lane: BubbleLane, animated: boolean): QuestionBubbleData {
  const left = lane === "left" ? 18 + Math.random() * 14 : 68 + Math.random() * 14;
  const top = 18 + Math.random() * 64;
  if (!animated) return { id, left: `${left}%`, top: `${top}%`, dx: "0px", dy: "0px", animated };
  const angle = lane === "left" ? Math.PI / 2 + Math.random() * Math.PI : -Math.PI / 2 + Math.random() * Math.PI;
  const distance = 28 + Math.random() * 16;
  return {
    id,
    left: `${left}%`,
    top: `${top}%`,
    dx: `${Math.cos(angle) * distance}px`,
    dy: `${Math.sin(angle) * distance}px`,
    animated,
  };
}

export function QuestionBubble({ bubble, onAnimationEnd }: { bubble: QuestionBubbleData; onAnimationEnd?: () => void }) {
  return <span
    key={bubble.id}
    aria-hidden="true"
    className={`question-bubble${bubble.animated ? " question-bubble--animated" : ""}`}
    style={{
      "--bubble-left": bubble.left,
      "--bubble-top": bubble.top,
      "--bubble-dx": bubble.dx,
      "--bubble-dy": bubble.dy,
    } as CSSProperties}
    onAnimationEnd={onAnimationEnd}
  />;
}
