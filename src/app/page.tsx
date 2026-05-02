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

type Chain = "MegaETH" | "Monad";

type Stats = {
  throughput: number;
  latency: number;
  composability: number;
  decentralization: number;
  developerFit: number;
};

type Card = {
  id: string;
  chain: Chain;
  name: string;
  kicker: string;
  description: string;
  stats: Stats;
  tradeoff: string;
};

type Arena = {
  id: string;
  name: string;
  label: string;
  description: string;
  weights: Stats;
  pressure: string;
};

type Fighter = {
  chain: Chain;
  tagline: string;
  baseStats: Stats;
  cards: Card[];
};

type BattleResult = {
  winner: Chain | "Draw";
  megaScore: number;
  monadScore: number;
  arena: Arena;
  megaFighter: Fighter;
  monadFighter: Fighter;
  log: string[];
  explanation: string;
  keyFactors: string[];
  tradeoffs: string[];
};

const emptyStats: Stats = {
  throughput: 0,
  latency: 0,
  composability: 0,
  decentralization: 0,
  developerFit: 0,
};

const statLabels: Record<keyof Stats, string> = {
  throughput: "Throughput",
  latency: "Low latency",
  composability: "Composability",
  decentralization: "Decentralization",
  developerFit: "Developer fit",
};

const arenas: Arena[] = [
  {
    id: "realtime-trading",
    name: "Neon Trading Pit",
    label: "Realtime execution",
    description:
      "A volatile arena where confirmation speed, predictable ordering, and fast feedback matter most.",
    pressure:
      "Fast-moving apps reward latency advantages, but still expose design tradeoffs around settlement and infrastructure assumptions.",
    weights: {
      throughput: 1.1,
      latency: 1.6,
      composability: 0.9,
      decentralization: 0.7,
      developerFit: 0.8,
    },
  },
  {
    id: "consumer-surge",
    name: "Mass Mint Speedway",
    label: "User surge",
    description:
      "A consumer app stress test where many users arrive at once and the app needs to stay responsive.",
    pressure:
      "Burst traffic rewards raw capacity and smooth developer operations without making one architecture universally preferable.",
    weights: {
      throughput: 1.5,
      latency: 1,
      composability: 0.8,
      decentralization: 0.8,
      developerFit: 1,
    },
  },
  {
    id: "defi-composability",
    name: "Composable DeFi Grid",
    label: "Protocol routing",
    description:
      "A protocol arena focused on liquidity routing, familiar tooling, and how easily apps can connect.",
    pressure:
      "Composability and developer fit carry more weight here, while performance still affects user experience.",
    weights: {
      throughput: 0.9,
      latency: 0.8,
      composability: 1.5,
      decentralization: 1,
      developerFit: 1.2,
    },
  },
];

const megaCards: Card[] = [
  {
    id: "mega-realtime",
    chain: "MegaETH",
    name: "Realtime Sequencer",
    kicker: "Speed burst",
    description:
      "Pushes the fighter toward very fast feedback loops for apps that need near-instant interactions.",
    stats: {
      throughput: 2,
      latency: 5,
      composability: 1,
      decentralization: -1,
      developerFit: 1,
    },
    tradeoff:
      "Realtime execution can depend heavily on specialized infrastructure and sequencing assumptions.",
  },
  {
    id: "mega-eth-alignment",
    chain: "MegaETH",
    name: "Ethereum Alignment",
    kicker: "L2 context",
    description:
      "Leans into Ethereum ecosystem familiarity while exploring high-performance L2 execution.",
    stats: {
      throughput: 1,
      latency: 1,
      composability: 3,
      decentralization: 1,
      developerFit: 2,
    },
    tradeoff:
      "L2 design can introduce bridge, settlement, and dependency questions that vary by use case.",
  },
  {
    id: "mega-specialized",
    chain: "MegaETH",
    name: "Specialized Execution",
    kicker: "Focused design",
    description:
      "Optimizes around a narrower performance target instead of treating every workload the same.",
    stats: {
      throughput: 3,
      latency: 2,
      composability: 0,
      decentralization: -1,
      developerFit: 1,
    },
    tradeoff:
      "Specialization can improve app feel while making infrastructure assumptions more important.",
  },
];

const monadCards: Card[] = [
  {
    id: "monad-parallel",
    chain: "Monad",
    name: "Parallel Execution",
    kicker: "Throughput burst",
    description:
      "Adds high-capacity execution for workloads where many transactions can be processed efficiently.",
    stats: {
      throughput: 5,
      latency: 1,
      composability: 1,
      decentralization: 0,
      developerFit: 1,
    },
    tradeoff:
      "Parallel systems still need careful app design when transactions touch shared state.",
  },
  {
    id: "monad-evm",
    chain: "Monad",
    name: "EVM Compatibility",
    kicker: "Builder access",
    description:
      "Keeps the fighter close to familiar EVM workflows while competing as a high-performance L1.",
    stats: {
      throughput: 1,
      latency: 0,
      composability: 2,
      decentralization: 1,
      developerFit: 3,
    },
    tradeoff:
      "Compatibility helps adoption, but app outcomes still depend on ecosystem maturity and deployment needs.",
  },
  {
    id: "monad-pipeline",
    chain: "Monad",
    name: "Optimized Pipeline",
    kicker: "System tuning",
    description:
      "Improves the execution pipeline across consensus and state handling for demanding onchain apps.",
    stats: {
      throughput: 3,
      latency: 2,
      composability: 0,
      decentralization: 1,
      developerFit: 0,
    },
    tradeoff:
      "Deep system optimization may shift complexity toward validators, infrastructure, and tooling readiness.",
  },
];

const baseFighters: Record<Chain, Omit<Fighter, "cards">> = {
  MegaETH: {
    chain: "MegaETH",
    tagline: "Realtime Ethereum L2 challenger",
    baseStats: {
      throughput: 6,
      latency: 8,
      composability: 7,
      decentralization: 5,
      developerFit: 7,
    },
  },
  Monad: {
    chain: "Monad",
    tagline: "High-performance EVM L1 challenger",
    baseStats: {
      throughput: 8,
      latency: 6,
      composability: 6,
      decentralization: 7,
      developerFit: 7,
    },
  },
};

const statKeys = Object.keys(emptyStats) as (keyof Stats)[];

function addStats(base: Stats, cards: Card[]): Stats {
  return cards.reduce(
    (total, card) => {
      statKeys.forEach((key) => {
        total[key] += card.stats[key];
      });
      return total;
    },
    { ...base },
  );
}

function scoreStats(stats: Stats, weights: Stats, randomShift: number) {
  return Math.round(
    statKeys.reduce((score, key) => score + stats[key] * weights[key], 0) +
      randomShift,
  );
}

function strongestWeightedStats(stats: Stats, weights: Stats) {
  return [...statKeys]
    .sort((a, b) => stats[b] * weights[b] - stats[a] * weights[a])
    .slice(0, 2)
    .map((key) => statLabels[key]);
}

function simulateBattle(
  arena: Arena,
  selectedMegaCards: Card[],
  selectedMonadCards: Card[],
): BattleResult {
  const megaFighter: Fighter = {
    ...baseFighters.MegaETH,
    cards: selectedMegaCards,
  };
  const monadFighter: Fighter = {
    ...baseFighters.Monad,
    cards: selectedMonadCards,
  };
  const megaStats = addStats(megaFighter.baseStats, megaFighter.cards);
  const monadStats = addStats(monadFighter.baseStats, monadFighter.cards);
  const megaVariance = Math.random() * 6 - 3;
  const monadVariance = Math.random() * 6 - 3;
  const megaScore = scoreStats(megaStats, arena.weights, megaVariance);
  const monadScore = scoreStats(monadStats, arena.weights, monadVariance);
  const winner =
    Math.abs(megaScore - monadScore) <= 2
      ? "Draw"
      : megaScore > monadScore
        ? "MegaETH"
        : "Monad";
  const leadingStats =
    winner === "MegaETH"
      ? megaStats
      : winner === "Monad"
        ? monadStats
        : undefined;
  const keyFactors = leadingStats
    ? strongestWeightedStats(leadingStats, arena.weights)
    : ["Context fit", "Balanced tradeoffs"];
  const explanation =
    winner === "Draw"
      ? `${arena.name} produced a close match. The selected cards created different strengths, but neither side separated enough to make a clear contextual winner.`
      : `${winner} edged ahead in ${arena.name} because ${keyFactors
          .map((factor) => factor.toLowerCase())
          .join(" and ")} mattered heavily in this arena. This is an arena-specific outcome, not a universal ranking.`;

  return {
    winner,
    megaScore,
    monadScore,
    arena,
    megaFighter,
    monadFighter,
    log: [
      `${arena.name} loaded: ${arena.pressure}`,
      `MegaETH enters with ${selectedMegaCards.length || "no"} feature ${
        selectedMegaCards.length === 1 ? "card" : "cards"
      }: ${selectedMegaCards.map((card) => card.name).join(", ") || "baseline kit"}.`,
      `Monad enters with ${selectedMonadCards.length || "no"} feature ${
        selectedMonadCards.length === 1 ? "card" : "cards"
      }: ${selectedMonadCards.map((card) => card.name).join(", ") || "baseline kit"}.`,
      `Weighted score check: MegaETH ${megaScore} vs Monad ${monadScore}.`,
      winner === "Draw"
        ? "Result: draw. The arena exposed a close contextual matchup."
        : `Result: ${winner} wins this arena by ${Math.abs(
            megaScore - monadScore,
          )} points.`,
    ],
    explanation,
    keyFactors,
    tradeoffs: [
      ...megaFighter.cards.map((card) => `MegaETH: ${card.tradeoff}`),
      ...monadFighter.cards.map((card) => `Monad: ${card.tradeoff}`),
    ],
  };
}

function CardButton({
  card,
  selected,
  onToggle,
}: {
  card: Card;
  selected: boolean;
  onToggle: (card: Card) => void;
}) {
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
          {card.kicker}
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
    megaCards[0].id,
  ]);
  const [selectedMonadIds, setSelectedMonadIds] = useState<string[]>([
    monadCards[0].id,
  ]);
  const [result, setResult] = useState<BattleResult | null>(null);
  const selectedArena =
    arenas.find((arena) => arena.id === selectedArenaId) ?? arenas[0];
  const selectedMegaCards = useMemo(
    () => megaCards.filter((card) => selectedMegaIds.includes(card.id)),
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
                in that scenario.
              </p>
              <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill label="Mode" value={1} />
                <StatPill label="Arenas" value={arenas.length} />
                <StatPill label="Cards" value={megaCards.length + monadCards.length} />
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
                <h2 className="mt-2 text-3xl font-black">Choose the pressure test</h2>
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
                      {arena.label}
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
                <h2 className="mt-1 text-3xl font-black">Load up to two cards</h2>
              </div>
            </div>
            <div className="grid gap-4">
              {megaCards.map((card) => (
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
                <h2 className="mt-1 text-3xl font-black">Tune the challenger</h2>
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
                arena weights, and a small randomness band so rematches can vary.
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
                <h2 className="mt-1 text-3xl font-black">Contextual verdict</h2>
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
                      Reminder: this matchup evaluates the selected cards inside
                      one arena. Different applications can reasonably prefer
                      different chain designs.
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
