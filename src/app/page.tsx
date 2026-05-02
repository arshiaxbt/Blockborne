"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  Gauge,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";
import {
  arenas,
  baseFighters,
  megaethCards,
  monadCards,
  type Card,
  type Chain,
} from "@/lib/game-data";
import { simulateBattle, type BattleResult } from "@/lib/battle-engine";

function CardButton({
  card,
  selected,
  onToggle,
}: {
  card: Card;
  selected: boolean;
  onToggle: (card: Card) => void;
}) {
  const downsideCount = Object.values(card.downsides).filter(
    (value) => (value ?? 0) < 0,
  ).length;

  return (
    <button
      type="button"
      onClick={() => onToggle(card)}
      className={`group rounded-lg border p-4 text-left transition duration-200 ${
        selected
          ? "border-cyan-300 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.18)]"
          : "border-white/10 bg-white/[0.04] hover:border-fuchsia-300/70 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
          {card.subtitle}
        </span>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            selected ? "bg-cyan-300" : "bg-white/25 group-hover:bg-fuchsia-300"
          }`}
        />
      </div>
      <h3 className="mt-3 text-lg font-black text-white">{card.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {card.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded bg-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-200">
          {card.rarity}
        </span>
        <span className="rounded bg-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-200">
          Max {card.maxCopies}
        </span>
        <span className="rounded bg-fuchsia-300/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-fuchsia-100">
          {downsideCount ? `${downsideCount} tradeoff` : "clean boost"}
        </span>
      </div>
    </button>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-bold text-cyan-100">
        {value.toFixed(1)}x
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedArenaId, setSelectedArenaId] = useState(arenas[0].id);
  const [selectedMegaIds, setSelectedMegaIds] = useState<string[]>([
    megaethCards[0].id,
  ]);
  const [selectedMonadIds, setSelectedMonadIds] = useState<string[]>([
    monadCards[0].id,
  ]);
  const [result, setResult] = useState<BattleResult | null>(null);
  const selectedArena =
    arenas.find((arena) => arena.id === selectedArenaId) ?? arenas[0];
  const selectedMegaCards = useMemo(
    () => megaethCards.filter((card) => selectedMegaIds.includes(card.id)),
    [selectedMegaIds],
  );
  const selectedMonadCards = useMemo(
    () => monadCards.filter((card) => selectedMonadIds.includes(card.id)),
    [selectedMonadIds],
  );

  const toggleCard = (
    card: Card,
    selectedIds: string[],
    setSelectedIds: (ids: string[]) => void,
  ) => {
    if (selectedIds.includes(card.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== card.id));
      return;
    }
    setSelectedIds([...selectedIds, card.id].slice(-2));
  };

  const startBattle = () => {
    setResult(
      simulateBattle(selectedArena, selectedMegaCards, selectedMonadCards),
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#080812] text-white">
      <div className="absolute inset-0 -z-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="relative z-10">
        <section className="mx-auto flex min-h-[92vh] w-full max-w-7xl flex-col justify-center px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="inline-flex items-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">
                <Sparkles size={15} />
                Educational auto-fighter
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
                FastEVM Fighters
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Pick an arena, load feature cards for MegaETH and Monad, then
                watch a contextual matchup explain which design choices mattered
                in that scenario. This is an educational game, not financial
                advice.
              </p>
              <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill label="Mode" value={1} />
                <StatPill label="Arenas" value={arenas.length} />
                <StatPill
                  label="Cards"
                  value={megaethCards.length + monadCards.length}
                />
                <StatPill label="Wallets" value={0} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_0_70px_rgba(236,72,153,0.12)] backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-200">
                    Match preview
                  </p>
                  <h2 className="mt-1 text-2xl font-black">EVM Duel Deck</h2>
                </div>
                <Swords className="text-cyan-200" size={30} />
              </div>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
                {(["MegaETH", "Monad"] as Chain[]).map((chain, index) => (
                  <div
                    key={chain}
                    className="rounded-lg border border-white/10 bg-black/40 p-4"
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-[0.2em] ${
                        index === 0 ? "text-cyan-200" : "text-fuchsia-200"
                      }`}
                    >
                      {chain}
                    </p>
                    <p className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {baseFighters[chain].layer} / {baseFighters[chain].gasToken} gas
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {baseFighters[chain].tagline}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-center font-mono text-xl font-black text-lime-200">
                  VS
                </div>
              </div>
              <p className="mt-5 rounded-md border border-lime-300/20 bg-lime-300/10 p-4 text-sm leading-6 text-lime-50">
                Outcomes are weighted by the selected arena and card tradeoffs.
                The result is a teaching aid, not a global chain ranking.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-black/35 px-5 py-12 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                  Arena selection
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Choose the pressure test
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-400">
                Each arena changes the stat weights, so the same cards can
                produce different lessons.
              </p>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {arenas.map((arena) => (
                <button
                  key={arena.id}
                  type="button"
                  onClick={() => {
                    setSelectedArenaId(arena.id);
                    setResult(null);
                  }}
                  className={`rounded-lg border p-5 text-left transition ${
                    selectedArena.id === arena.id
                      ? "border-lime-300 bg-lime-300/10 shadow-[0_0_30px_rgba(190,242,100,0.13)]"
                      : "border-white/10 bg-white/[0.04] hover:border-lime-300/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded bg-white/10 px-2 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
                      Arena
                    </span>
                    <RadioTower className="text-lime-200" size={20} />
                  </div>
                  <h3 className="mt-4 text-xl font-black">{arena.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {arena.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Zap className="text-cyan-200" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                  MegaETH card selection
                </p>
                <h2 className="mt-1 text-3xl font-black">
                  Load up to two cards
                </h2>
              </div>
            </div>
            <div className="grid gap-4">
              {megaethCards.map((card) => (
                <CardButton
                  key={card.id}
                  card={card}
                  selected={selectedMegaIds.includes(card.id)}
                  onToggle={(nextCard) =>
                    toggleCard(nextCard, selectedMegaIds, setSelectedMegaIds)
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <Cpu className="text-fuchsia-200" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-200">
                  Monad card selection
                </p>
                <h2 className="mt-1 text-3xl font-black">
                  Tune the challenger
                </h2>
              </div>
            </div>
            <div className="grid gap-4">
              {monadCards.map((card) => (
                <CardButton
                  key={card.id}
                  card={card}
                  selected={selectedMonadIds.includes(card.id)}
                  onToggle={(nextCard) =>
                    toggleCard(nextCard, selectedMonadIds, setSelectedMonadIds)
                  }
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-lime-200">
                Start battle
              </p>
              <h2 className="mt-2 text-3xl font-black">Run the simulation</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                The simulator combines baseline stats, selected feature cards,
                arena weights, card downsides, and a small randomness band so
                rematches can vary.
              </p>
              <button
                type="button"
                onClick={startBattle}
                className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-lime-300 px-5 font-black uppercase tracking-[0.18em] text-black transition hover:bg-cyan-200"
              >
                <Swords size={20} />
                Start battle
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/45 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                    Battle log
                  </p>
                  <h2 className="mt-2 text-3xl font-black">Arena telemetry</h2>
                </div>
                <Activity className="text-cyan-200" size={28} />
              </div>
              <div className="mt-5 space-y-3 font-mono text-sm">
                {(result?.log ?? [
                  "Awaiting arena lock...",
                  "Select cards for each chain.",
                  "Press start battle to generate the matchup log.",
                ]).map((entry, index) => (
                  <div
                    key={`${entry}-${index}`}
                    className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-slate-200"
                  >
                    <span className="mr-3 text-lime-200">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_34%),#080812] px-5 py-14 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-lime-200" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-lime-200">
                  Result panel
                </p>
                <h2 className="mt-1 text-3xl font-black">
                  Contextual verdict
                </h2>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
              {result ? (
                <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-lg border border-white/10 bg-black/40 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                      Winner
                    </p>
                    <div className="mt-3 text-5xl font-black text-white">
                      {result.winner}
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-cyan-300/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                          MegaETH
                        </p>
                        <p className="mt-2 font-mono text-3xl font-black">
                          {result.megaScore}
                        </p>
                      </div>
                      <div className="rounded-md bg-fuchsia-300/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-fuchsia-200">
                          Monad
                        </p>
                        <p className="mt-2 font-mono text-3xl font-black">
                          {result.monadScore}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-lg leading-8 text-slate-200">
                      {result.explanation}
                    </p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
                          <Gauge size={18} />
                          Key factors
                        </div>
                        <ul className="space-y-2 text-sm text-slate-300">
                          {result.keyFactors.map((factor) => (
                            <li key={factor}>- {factor}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                        <div className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-fuchsia-200">
                          Tradeoffs exposed
                        </div>
                        <ul className="space-y-2 text-sm leading-6 text-slate-300">
                          {(result.tradeoffs.length
                            ? result.tradeoffs
                            : [
                                "No feature cards selected, so only baseline assumptions were compared.",
                              ]
                          ).map((tradeoff) => (
                            <li key={tradeoff}>- {tradeoff}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p className="mt-5 rounded-md border border-lime-300/20 bg-lime-300/10 p-4 text-sm leading-6 text-lime-50">
                      Reminder: this matchup evaluates selected cards inside
                      one arena. Different applications can reasonably prefer
                      different chain designs, and this game is not financial
                      advice.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  No result yet. Choose an arena, pick feature cards, and start
                  the battle to generate an explanation.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
