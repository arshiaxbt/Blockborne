"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Clipboard,
  Cpu,
  Gauge,
  RadioTower,
  RotateCcw,
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
  type Stats,
} from "@/lib/game-data";
import {
  applyCardsToFighter,
  calculateArenaScore,
  simulateBattle,
  type BattleFighter,
  type BattleResult,
} from "@/lib/battle-engine";

const OnchainActions = dynamic(
  () =>
    import("@/components/OnchainActions").then(
      (module) => module.OnchainActions,
    ),
  {
    ssr: false,
  },
);

const PrivyLoginButton = dynamic(
  () =>
    import("@/components/PrivyLoginButton").then(
      (module) => module.PrivyLoginButton,
    ),
  {
    ssr: false,
  },
);

const maxCardsPerSide = 4;

const statKeys: (keyof Stats)[] = [
  "speed",
  "throughput",
  "security",
  "decentralization",
  "composability",
  "ux",
  "reliability",
];

const statLabels: Record<keyof Stats, string> = {
  speed: "Speed",
  throughput: "Throughput",
  security: "Security",
  decentralization: "Decentralization",
  composability: "Composability",
  ux: "UX",
  reliability: "Reliability",
};

const chainTheme: Record<
  Chain,
  {
    accent: string;
    border: string;
    glow: string;
    soft: string;
    text: string;
    bar: string;
    panel: string;
  }
> = {
  MegaETH: {
    accent: "from-orange-300 via-cyan-200 to-white",
    border: "border-orange-300/40",
    glow: "shadow-[0_0_34px_rgba(251,146,60,0.18)]",
    soft: "bg-orange-300/10",
    text: "text-orange-100",
    bar: "from-orange-400 via-cyan-300 to-white",
    panel:
      "border-orange-300/25 bg-[linear-gradient(135deg,rgba(251,146,60,0.14),rgba(34,211,238,0.08),rgba(255,255,255,0.04))]",
  },
  Monad: {
    accent: "from-fuchsia-300 via-violet-300 to-purple-950",
    border: "border-fuchsia-300/40",
    glow: "shadow-[0_0_34px_rgba(217,70,239,0.18)]",
    soft: "bg-fuchsia-300/10",
    text: "text-fuchsia-100",
    bar: "from-fuchsia-400 via-violet-400 to-purple-950",
    panel:
      "border-fuchsia-300/25 bg-[linear-gradient(135deg,rgba(88,28,135,0.42),rgba(0,0,0,0.36),rgba(217,70,239,0.1))]",
  },
};

function clampPercent(value: number) {
  return `${Math.min(100, Math.max(3, (value / 150) * 100))}%`;
}

function createBattleSeed() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `battle-${Date.now()}-${performance.now()}`;
}

function buildPreview(chain: Chain, cards: Card[], arenaId: string) {
  const arena = arenas.find((item) => item.id === arenaId) ?? arenas[0];
  const fighter = applyCardsToFighter(baseFighters[chain], cards);
  return {
    ...fighter,
    arenaScore: calculateArenaScore(fighter, arena),
  };
}

function CardButton({
  card,
  selected,
  disabled,
  onToggle,
  learnMode,
}: {
  card: Card;
  selected: boolean;
  disabled: boolean;
  onToggle: (card: Card) => void;
  learnMode: boolean;
}) {
  const theme = chainTheme[card.chain];
  const downsideCount = Object.values(card.downsides).filter(
    (value) => (value ?? 0) < 0,
  ).length;

  return (
    <div
      className={`group rounded-lg border transition duration-200 ${
        selected
          ? `${theme.border} ${theme.soft} ${theme.glow}`
          : "border-white/10 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.07]"
      } ${
        disabled
          ? "cursor-not-allowed opacity-40 hover:border-white/10 hover:bg-white/[0.04]"
          : ""
      }`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(card)}
        className="w-full p-4 text-left disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className={`text-xs font-bold uppercase tracking-[0.22em] ${theme.text}`}
          >
            {card.subtitle}
          </span>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              selected ? "bg-white" : "bg-white/25 group-hover:bg-white/70"
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
          <span className="rounded bg-black/30 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-200">
            {downsideCount ? `${downsideCount} tradeoff` : "clean boost"}
          </span>
        </div>
      </button>
      {learnMode ? (
        <details className="mx-4 mb-4 rounded-md border border-white/10 bg-black/30 p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
            Educational note
          </summary>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {card.educationalNote}
          </p>
        </details>
      ) : null}
    </div>
  );
}

function StatBar({
  label,
  value,
  chain,
}: {
  label: string;
  value: number;
  chain: Chain;
}) {
  const theme = chainTheme[chain];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </span>
        <span className="font-mono font-bold text-slate-100">{value}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded bg-white/10">
        <motion.div
          initial={false}
          animate={{ width: clampPercent(value) }}
          transition={{ duration: 0.35 }}
          className={`h-full rounded bg-gradient-to-r ${theme.bar}`}
        />
      </div>
    </div>
  );
}

function FighterPreview({
  fighter,
  chain,
}: {
  fighter: BattleFighter;
  chain: Chain;
}) {
  const theme = chainTheme[chain];

  return (
    <div className={`rounded-lg border p-5 ${theme.panel}`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.24em] ${theme.text}`}>
            {chain} live stat preview
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            {fighter.tagline}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {fighter.layer} / {fighter.gasToken} gas
          </p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/35 px-3 py-2 text-right">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            Arena score
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-white">
            {fighter.arenaScore}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {statKeys.map((key) => (
          <StatBar
            key={`${chain}-${key}`}
            label={statLabels[key]}
            value={fighter.finalStats[key]}
            chain={chain}
          />
        ))}
      </div>
    </div>
  );
}

function LearnModeToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${
        enabled
          ? "border-lime-300 bg-lime-300/15 text-lime-50"
          : "border-white/15 bg-white/[0.04] text-slate-300 hover:border-white/35"
      }`}
    >
      <BookOpen size={18} />
      Learn Mode {enabled ? "On" : "Off"}
    </button>
  );
}

function ArenaWeights({
  arena,
  learnMode,
}: {
  arena: (typeof arenas)[number];
  learnMode: boolean;
}) {
  if (!learnMode) {
    return null;
  }

  return (
    <div className="mt-4 rounded-md border border-white/10 bg-black/30 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-100">
        Why these stats matter
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {arena.statRationale}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {statKeys.map((key) => (
          <div
            key={`${arena.id}-${key}`}
            className="rounded bg-white/[0.06] px-2 py-1 text-xs text-slate-300"
          >
            <span className="font-bold text-white">{statLabels[key]}</span>{" "}
            {arena.weights[key].toFixed(1)}x
          </div>
        ))}
      </div>
    </div>
  );
}

function strongestStat(fighter: BattleFighter) {
  return [...statKeys].sort(
    (left, right) => fighter.finalStats[right] - fighter.finalStats[left],
  )[0];
}

function resultInsights(result: BattleResult) {
  const winner =
    result.winner === "MegaETH"
      ? result.megaFighter
      : result.winner === "Monad"
        ? result.monadFighter
        : result.megaFighter.hp >= result.monadFighter.hp
          ? result.megaFighter
          : result.monadFighter;
  const loser =
    winner.chain === "MegaETH" ? result.monadFighter : result.megaFighter;
  const loserStat = strongestStat(loser);

  return {
    winner,
    loser,
    loserStrength: `${loser.chain} stayed strongest in ${statLabels[
      loserStat
    ].toLowerCase()} with a ${loser.finalStats[loserStat]} stat value.`,
    lesson: `${result.arena.name} shows that chain design is about matching architecture to application needs: the same speed, throughput, security, decentralization, composability, UX, and reliability tradeoffs can matter differently in another arena.`,
  };
}

function loadoutLabel(cards: Card[]) {
  return cards.length
    ? cards.map((card) => card.name).join(" + ")
    : "Baseline kit";
}

function battleSummary(result: BattleResult) {
  if (result.winner === "Draw") {
    return `Draw in ${result.arena.name} with MegaETH ${loadoutLabel(
      result.megaFighter.cards,
    )} vs Monad ${loadoutLabel(result.monadFighter.cards)}.`;
  }

  const winnerCards =
    result.winner === "MegaETH"
      ? result.megaFighter.cards
      : result.monadFighter.cards;

  return `${result.winner} won in ${result.arena.name} with ${loadoutLabel(
    winnerCards,
  )}.`;
}

function xPostSummary(result: BattleResult) {
  return [
    "FastEVM Fighters result",
    `${result.winner} in ${result.arena.name}`,
    `MegaETH loadout: ${loadoutLabel(result.megaFighter.cards)}`,
    `Monad loadout: ${loadoutLabel(result.monadFighter.cards)}`,
    `Main reason: ${result.keyFactors.join(" + ")}`,
    "Contextual result, not global ranking.",
  ].join("\n");
}

function ResultShareCard({ result }: { result: BattleResult }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#090914] shadow-[0_0_70px_rgba(34,211,238,0.12)]">
      <div className="bg-[radial-gradient(circle_at_15%_0%,rgba(251,146,60,0.28),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(168,85,247,0.28),transparent_35%),linear-gradient(135deg,rgba(34,211,238,0.14),rgba(0,0,0,0.2))] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100">
              FastEVM Fighters
            </p>
            <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              {result.winner} in this arena
            </h3>
          </div>
          <div className="rounded-md border border-white/15 bg-black/35 px-3 py-2 text-right">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              Arena
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {result.arena.name}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-orange-300/20 bg-orange-300/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">
              MegaETH loadout
            </p>
            <p className="mt-2 text-lg font-black text-white">
              {loadoutLabel(result.megaFighter.cards)}
            </p>
          </div>
          <div className="rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-100">
              Monad loadout
            </p>
            <p className="mt-2 text-lg font-black text-white">
              {loadoutLabel(result.monadFighter.cards)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-100">
            Main reason
          </p>
          <p className="mt-2 text-base leading-7 text-slate-100">
            {result.keyFactors.join(" + ")} mattered most under the selected
            arena weights.
          </p>
        </div>

        <p className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-3 text-sm font-bold text-slate-100">
          Contextual result, not global ranking
        </p>
      </div>
    </div>
  );
}

function ArchitectureFlow({
  title,
  chain,
  steps,
}: {
  title: string;
  chain: Chain;
  steps: string[];
}) {
  const theme = chainTheme[chain];

  return (
    <div className={`rounded-lg border p-5 ${theme.panel}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.24em] ${theme.text}`}>
        {title}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:hidden">
        {steps.map((step, index) => (
          <div key={`${chain}-${step}`}>
            <div className="rounded-md border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white">
              {step}
            </div>
            {index < steps.length - 1 ? (
              <div className="flex justify-center py-2 text-slate-500 sm:hidden">
                <ArrowRight className="rotate-90" size={18} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-5 hidden items-center gap-2 overflow-x-auto pb-1 sm:flex">
        {steps.map((step, index) => (
          <div key={`${chain}-wide-${step}`} className="flex items-center gap-2">
            <div className="whitespace-nowrap rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm font-bold text-white">
              {step}
            </div>
            {index < steps.length - 1 ? (
              <ArrowRight className="shrink-0 text-slate-500" size={18} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
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
  const [visibleLogCount, setVisibleLogCount] = useState(0);
  const [battleSeed, setBattleSeed] = useState<string | null>(null);
  const [learnMode, setLearnMode] = useState(false);
  const [copiedType, setCopiedType] = useState<"summary" | "x" | null>(null);
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
  const megaPreview = useMemo(
    () => buildPreview("MegaETH", selectedMegaCards, selectedArenaId),
    [selectedMegaCards, selectedArenaId],
  );
  const monadPreview = useMemo(
    () => buildPreview("Monad", selectedMonadCards, selectedArenaId),
    [selectedMonadCards, selectedArenaId],
  );

  useEffect(() => {
    if (!result) {
      setVisibleLogCount(0);
      return;
    }

    setVisibleLogCount(0);
    const timers = result.log.map((_, index) =>
      window.setTimeout(() => {
        setVisibleLogCount(index + 1);
      }, 260 * (index + 1)),
    );

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [result]);

  const toggleCard = (
    card: Card,
    selectedIds: string[],
    setSelectedIds: (ids: string[]) => void,
  ) => {
    setResult(null);
    setBattleSeed(null);

    if (selectedIds.includes(card.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== card.id));
      return;
    }

    if (selectedIds.length >= maxCardsPerSide) {
      return;
    }

    setSelectedIds([...selectedIds, card.id]);
  };

  const runBattle = () => {
    const seed = createBattleSeed();
    setBattleSeed(seed);
    setCopiedType(null);
    setResult(
      simulateBattle(selectedArena, selectedMegaCards, selectedMonadCards, seed),
    );
  };

  const resetLoadout = () => {
    setSelectedMegaIds([]);
    setSelectedMonadIds([]);
    setResult(null);
    setBattleSeed(null);
    setCopiedType(null);
  };

  const copyText = async (text: string, type: "summary" | "x") => {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    window.setTimeout(() => setCopiedType(null), 1600);
  };

  const visibleLog = result?.log.slice(0, visibleLogCount);
  const insights = result ? resultInsights(result) : null;
  const shareSummary = result ? battleSummary(result) : "";
  const shareXPost = result ? xPostSummary(result) : "";

  return (
    <main className="min-h-screen overflow-hidden bg-[#080812] text-white">
      <div className="absolute inset-0 -z-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="relative z-10">
        <section className="mx-auto flex min-h-[88vh] w-full max-w-7xl flex-col justify-center px-5 py-16 sm:px-8 lg:px-10">
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
                Build two temporary EVM loadouts, preview the stat impact, then
                run an eight-round seeded battle. Outcomes are contextual
                teaching aids, not financial advice or universal rankings.
              </p>
              <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill label="Arenas" value={arenas.length} />
                <StatPill
                  label="Cards"
                  value={megaethCards.length + monadCards.length}
                />
                <StatPill label="Rounds" value={8} />
                <StatPill label="Wallets" value={0} />
              </div>
              <div className="mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <LearnModeToggle
                    enabled={learnMode}
                    onToggle={() => setLearnMode((value) => !value)}
                  />
                  <PrivyLoginButton />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_0_70px_rgba(168,85,247,0.14)] backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-200">
                    Match preview
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Realtime vs parallel</h2>
                </div>
                <Swords className="text-cyan-200" size={30} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
                {(["MegaETH", "Monad"] as Chain[]).map((chain) => (
                  <div
                    key={chain}
                    className={`rounded-lg border p-4 ${chainTheme[chain].panel}`}
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-[0.2em] ${chainTheme[chain].text}`}
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
                Select one arena and up to four cards per side. Extra cards are
                disabled until a slot opens.
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
                  Choose exactly one pressure test
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-400">
                Arena weights decide which stats matter most during the battle.
              </p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {arenas.map((arena) => (
                <button
                  key={arena.id}
                  type="button"
                  onClick={() => {
                    setSelectedArenaId(arena.id);
                    setResult(null);
                    setBattleSeed(null);
                  }}
                  className={`rounded-lg border p-5 text-left transition ${
                    selectedArena.id === arena.id
                      ? "border-lime-300 bg-lime-300/10 shadow-[0_0_30px_rgba(190,242,100,0.13)]"
                      : "border-white/10 bg-white/[0.04] hover:border-lime-300/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded bg-white/10 px-2 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
                      {selectedArena.id === arena.id ? "Selected" : "Arena"}
                    </span>
                    <RadioTower className="text-lime-200" size={20} />
                  </div>
                  <h3 className="mt-4 text-xl font-black">{arena.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {arena.description}
                  </p>
                  <ArenaWeights arena={arena} learnMode={learnMode} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:px-10">
          <FighterPreview fighter={megaPreview} chain="MegaETH" />
          <FighterPreview fighter={monadPreview} chain="Monad" />
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-12 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap className="text-orange-200" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-200">
                    MegaETH card selection
                  </p>
                  <h2 className="mt-1 text-3xl font-black">
                    {selectedMegaIds.length}/{maxCardsPerSide} cards loaded
                  </h2>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              {megaethCards.map((card) => (
                <CardButton
                  key={card.id}
                  card={card}
                  selected={selectedMegaIds.includes(card.id)}
                  disabled={
                    !selectedMegaIds.includes(card.id) &&
                    selectedMegaIds.length >= maxCardsPerSide
                  }
                  learnMode={learnMode}
                  onToggle={(nextCard) =>
                    toggleCard(nextCard, selectedMegaIds, setSelectedMegaIds)
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Cpu className="text-fuchsia-200" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-200">
                    Monad card selection
                  </p>
                  <h2 className="mt-1 text-3xl font-black">
                    {selectedMonadIds.length}/{maxCardsPerSide} cards loaded
                  </h2>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              {monadCards.map((card) => (
                <CardButton
                  key={card.id}
                  card={card}
                  selected={selectedMonadIds.includes(card.id)}
                  disabled={
                    !selectedMonadIds.includes(card.id) &&
                    selectedMonadIds.length >= maxCardsPerSide
                  }
                  learnMode={learnMode}
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
                The engine generates a seed, applies the current loadout, then
                reveals the battle log round by round.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={runBattle}
                  className="flex h-14 items-center justify-center gap-3 rounded-lg bg-lime-300 px-5 font-black uppercase tracking-[0.18em] text-black transition hover:bg-cyan-200"
                >
                  <Swords size={20} />
                  Start battle
                </button>
                <button
                  type="button"
                  onClick={resetLoadout}
                  className="flex h-14 items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/[0.04] px-5 font-black uppercase tracking-[0.18em] text-white transition hover:border-white/35 hover:bg-white/[0.08]"
                >
                  <RotateCcw size={19} />
                  Reset loadout
                </button>
              </div>
              {result ? (
                <button
                  type="button"
                  onClick={runBattle}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-fuchsia-300/40 bg-fuchsia-300/10 px-5 font-black uppercase tracking-[0.18em] text-fuchsia-50 transition hover:bg-fuchsia-300/18"
                >
                  <Activity size={18} />
                  Run rematch
                </button>
              ) : null}
              <p className="mt-4 font-mono text-xs leading-6 text-slate-500">
                Seed: {battleSeed ?? "not generated yet"}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/45 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                    Battle log
                  </p>
                  <h2 className="mt-2 text-3xl font-black">Round telemetry</h2>
                </div>
                <Activity className="text-cyan-200" size={28} />
              </div>
              <div className="mt-5 space-y-3 font-mono text-sm">
                {(visibleLog?.length
                  ? visibleLog
                  : [
                      "Awaiting generated seed...",
                      "Select up to four cards per side.",
                      "Press start battle to reveal the combat log.",
                    ]
                ).map((entry, index) => (
                  <motion.div
                    key={`${entry}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-slate-200"
                  >
                    <span className="mr-3 text-lime-200">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {entry}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),transparent_30%),radial-gradient(circle_at_70%_0%,rgba(168,85,247,0.18),transparent_32%),#080812] px-5 py-14 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-lime-200" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-lime-200">
                  Result panel
                </p>
                <h2 className="mt-1 text-3xl font-black">
                  Final result and why
                </h2>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.045] p-5">
              {result ? (
                <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-lg border border-white/10 bg-black/40 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                      Winner in this context
                    </p>
                    <div className="mt-3 text-5xl font-black text-white">
                      {result.winner}
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-orange-300/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-orange-200">
                          MegaETH
                        </p>
                        <p className="mt-2 font-mono text-3xl font-black">
                          {result.megaFighter.hp} HP
                        </p>
                        <p className="mt-1 font-mono text-sm text-slate-400">
                          Score {result.megaScore}
                        </p>
                      </div>
                      <div className="rounded-md bg-fuchsia-300/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-fuchsia-200">
                          Monad
                        </p>
                        <p className="mt-2 font-mono text-3xl font-black">
                          {result.monadFighter.hp} HP
                        </p>
                        <p className="mt-1 font-mono text-sm text-slate-400">
                          Score {result.monadScore}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="grid gap-4">
                      <div className="rounded-lg border border-white/10 bg-black/30 p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
                          <Gauge size={18} />
                          Why they won
                        </div>
                        <p className="text-base leading-7 text-slate-200">
                          {result.explanation}
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                          <div className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-orange-200">
                            What the loser was strong at
                          </div>
                          <p className="text-sm leading-6 text-slate-300">
                            {insights?.loserStrength}
                          </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                          <div className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-lime-200">
                            What this teaches
                          </div>
                          <p className="text-sm leading-6 text-slate-300">
                            {insights?.lesson}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                          <div className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
                            Top weighted stats
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
                            {result.tradeoffs.map((tradeoff) => (
                              <li key={tradeoff}>- {tradeoff}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <p className="rounded-md border border-lime-300/20 bg-lime-300/10 p-4 text-sm font-bold leading-6 text-lime-50">
                        This is contextual, not a universal ranking.
                      </p>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <OnchainActions result={result} />
                  </div>
                  <div className="grid gap-4 lg:col-span-2">
                    <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                            Shareable result
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {shareSummary}
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 md:min-w-[21rem]">
                          <button
                            type="button"
                            onClick={() => copyText(shareSummary, "summary")}
                            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-4 text-sm font-black uppercase tracking-[0.16em] text-cyan-50 transition hover:bg-cyan-300/18"
                          >
                            <Clipboard size={16} />
                            {copiedType === "summary" ? "Copied" : "Copy"}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyText(shareXPost, "x")}
                            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-fuchsia-300/35 bg-fuchsia-300/10 px-4 text-sm font-black uppercase tracking-[0.16em] text-fuchsia-50 transition hover:bg-fuchsia-300/18"
                          >
                            <Clipboard size={16} />
                            {copiedType === "x" ? "Copied" : "Copy X post"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <ResultShareCard result={result} />
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  No result yet. Choose one arena, pick cards, and start the
                  battle to generate a seeded explanation.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-black/45 px-5 py-14 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                  Compare architecture
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Two simplified execution flows
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-400">
                These are simplified teaching flows for the game model, not
                complete protocol diagrams.
              </p>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ArchitectureFlow
                title="MegaETH flow"
                chain="MegaETH"
                steps={[
                  "User",
                  "RPC",
                  "Sequencer",
                  "Mini-block",
                  "State streaming",
                  "EigenDA",
                  "Ethereum",
                ]}
              />
              <ArchitectureFlow
                title="Monad flow"
                chain="Monad"
                steps={[
                  "User",
                  "RPC",
                  "MonadBFT ordering",
                  "Parallel execution",
                  "MonadDB/state",
                  "Finality",
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
