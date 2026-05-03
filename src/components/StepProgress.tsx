"use client";

const steps = ["Arena", "Loadout", "Battle", "Result"] as const;

export type GameStep = (typeof steps)[number];

export function StepProgress({ current }: { current: GameStep }) {
  const activeIndex = steps.indexOf(current);

  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
      {steps.map((step, index) => {
        const active = step === current;
        const complete = index < activeIndex;

        return (
          <div
            key={step}
            className={`px-2 py-3 text-center text-[0.65rem] font-black uppercase tracking-[0.16em] sm:text-xs ${
              active
                ? "bg-cyan-300/15 text-cyan-50"
                : complete
                  ? "text-lime-100"
                  : "text-slate-500"
            }`}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}
