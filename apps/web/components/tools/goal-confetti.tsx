"use client";

type CelebrationState = "thriving" | "achieved";

const createPieces = (count: number) =>
  Array.from({ length: count }).map((_, index) => ({
    id: index,
    left: `${4 + ((index * 71) % 92)}%`,
    delay: `${(index * 0.08).toFixed(2)}s`
  }));

export function GoalConfetti({ state = "thriving" }: { state?: CelebrationState }) {
  const pieces = createPieces(state === "achieved" ? 26 : 14);
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden fi-confetti-wrap fi-confetti-wrap--${state}`}
      aria-hidden
    >
      <span className="fi-confetti-badge">
        {state === "achieved" ? "Goal Achieved" : "Thriving"}
      </span>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={`fi-confetti-piece fi-confetti-piece--${state}`}
          style={{ left: piece.left, animationDelay: piece.delay }}
        />
      ))}
    </div>
  );
}
