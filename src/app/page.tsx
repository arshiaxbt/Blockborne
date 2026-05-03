"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { BookOpen, Clipboard, LogOut, RotateCcw, Swords, Zap } from "lucide-react";
import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { LandingGate } from "@/components/LandingGate";
import { OnchainActionRecorder } from "@/components/OnchainActionRecorder";
import { StepProgress, type GameStep } from "@/components/StepProgress";
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
  { ssr: false },
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

type EthereumWallet = {
  address: string;
  type: "ethereum";
  walletClientType: string;
};

function isEmbeddedEthereumWallet(wallet: unknown): wallet is EthereumWallet {
  const candidate = wallet as Partial<EthereumWallet>;

  return (
    candidate.type === "ethereum" &&
    typeof candidate.address === "string" &&
    (candidate.walletClientType === "privy" ||
      candidate.walletClientType === "privy-v2")
  );
}

function createBattleSeed() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `blockborne-${Date.now()}`;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function loadoutLabel(cards: Card[]) {
  return cards.length ? cards.map((card) => card.name).join(" + ") : "Base kit";
}

function chainTone(chain: Chain) {
  return chain === "MegaETH"
    ? "border-orange-300/30 bg-orange-300/10 text-orange-50"
    : "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-50";
}

function buildPreview(chain: Chain, cards: Card[], arenaId: string) {
  const arena = arenas.find((item) => item.id === arenaId) ?? arenas[0];
  const fighter = applyCardsToFighter(baseFighters[chain], cards);
  return {
    ...fighter,
    arenaScore: calculateArenaScore(fighter, arena),
  };
}

function hpAfterRounds(result: BattleResult | null, shownRounds: number) {
  if (!result) return { MegaETH: 100, Monad: 100 };

  const hp = { MegaETH: 100, Monad: 100 };

  result.rounds.slice(0, shownRounds).forEach((round) => {
    hp[round.defender] = round.defenderHp;
  });

  return hp;
}

function strongestStat(fighter: BattleFighter) {
  return [...statKeys].sort(
    (left, right) => fighter.finalStats[right] - fighter.finalStats[left],
  )[0];
}

function resultBlocks(result: BattleResult) {
  const winner =
    result.winner === "MegaETH"
      ? result.megaFighter
      : result.winner === "Monad"
        ? result.monadFighter
        : result.megaFighter.hp >= result.monadFighter.hp
          ? result.megaFighter
          : result.monadFighter;
  const other = winner.chain === "MegaETH" ? result.monadFighter : result.megaFighter;
  const otherStat = strongestStat(other);

  return {
    why: `${result.keyFactors.join(" and ")} mattered most in ${result.arena.name}. ${winner.chain} matched that context better in this simulation.`,
    other: `${other.chain} was still strong in ${statLabels[otherStat].toLowerCase()} with a ${other.finalStats[otherStat]} stat value.`,
    teaches:
      "Network design is contextual: latency, throughput, security, decentralization, composability, UX, and reliability trade off differently by app type.",
  };
}

function WalletStatus() {
  const { logout } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const [creating, setCreating] = useState(false);
  const embeddedWallet = useMemo(
    () => wallets.find(isEmbeddedEthereumWallet),
    [wallets],
  );

  const createEmbeddedWallet = async () => {
    setCreating(true);
    try {
      await createWallet();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
          Wallet ready
        </p>
        <p className="mt-1 text-sm text-slate-300">
          {embeddedWallet
            ? `Embedded wallet ${shortenAddress(embeddedWallet.address)}`
            : "Create an in-app wallet for optional testnet records."}
        </p>
      </div>
      <div className="flex gap-2">
        {!embeddedWallet ? (
          <button
            type="button"
            onClick={createEmbeddedWallet}
            disabled={creating}
            className="rounded-lg border border-lime-300/30 bg-lime-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-lime-50 disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create in-app wallet"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-200 hover:bg-white/[0.06]"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );
}

function StatBars({ fighter }: { fighter: BattleFighter }) {
  return (
    <div className="grid gap-2">
      {statKeys.map((stat) => (
        <div key={`${fighter.chain}-${stat}`}>
          <div className="flex justify-between text-xs">
            <span className="font-bold uppercase tracking-[0.14em] text-slate-400">
              {statLabels[stat]}
            </span>
            <span className="font-mono text-slate-100">{fighter.finalStats[stat]}</span>
          </div>
          <div className="mt-1 h-2 rounded bg-white/10">
            <div
              className={`h-full rounded ${
                fighter.chain === "MegaETH"
                  ? "bg-gradient-to-r from-orange-400 to-cyan-300"
                  : "bg-gradient-to-r from-fuchsia-400 to-violet-300"
              }`}
              style={{
                width: `${Math.min(100, Math.max(4, (fighter.finalStats[stat] / 150) * 100))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FighterPanel({
  fighter,
  hp,
  arenaName,
}: {
  fighter: BattleFighter;
  hp: number;
  arenaName: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${chainTone(fighter.chain)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] opacity-80">
            {fighter.layer}
          </p>
          <h3 className="mt-2 text-3xl font-black text-white">{fighter.chain}</h3>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-right">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-400">
            HP
          </p>
          <p className="font-mono text-2xl font-black text-white">{Math.max(0, hp)}</p>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded bg-black/45">
        <div
          className="h-full rounded bg-lime-300"
          style={{ width: `${Math.max(0, Math.min(100, hp))}%` }}
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-200">
        Context fit for selected arena:{" "}
        <span className="font-black text-white">{fighter.arenaScore}</span> in{" "}
        {arenaName}
      </p>
      <details className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.16em] text-slate-200">
          Stats
        </summary>
        <div className="mt-3">
          <StatBars fighter={fighter} />
        </div>
      </details>
    </div>
  );
}

function ArenaStep({
  selectedArenaId,
  setSelectedArenaId,
  learnMode,
  setStep,
}: {
  selectedArenaId: string;
  setSelectedArenaId: (id: string) => void;
  learnMode: boolean;
  setStep: (step: GameStep) => void;
}) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-3xl font-black text-white">Choose Arena</h2>
        <p className="mt-2 text-slate-300">
          Each arena weights architecture tradeoffs differently.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {arenas.map((arena) => {
          const selected = arena.id === selectedArenaId;

          return (
            <button
              key={arena.id}
              type="button"
              onClick={() => setSelectedArenaId(arena.id)}
              className={`rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-cyan-300/45 bg-cyan-300/12 shadow-[0_0_34px_rgba(34,211,238,0.12)]"
                  : "border-white/10 bg-white/[0.04] hover:border-white/25"
              }`}
            >
              <h3 className="text-xl font-black text-white">{arena.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {arena.description}
              </p>
              {learnMode ? (
                <p className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-sm leading-6 text-slate-300">
                  {arena.statRationale}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setStep("Loadout")}
        className="rounded-xl border border-cyan-300/40 bg-cyan-300/15 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-cyan-50 hover:bg-cyan-300/22"
      >
        Continue to Loadout
      </button>
    </section>
  );
}

function CardGrid({
  chain,
  cards,
  selectedIds,
  onToggle,
  learnMode,
}: {
  chain: Chain;
  cards: Card[];
  selectedIds: string[];
  onToggle: (card: Card) => void;
  learnMode: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${chainTone(chain)}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-black text-white">{chain} Loadout</h3>
        <span className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-mono text-sm font-black text-white">
          {selectedIds.length}/4
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {cards.map((card) => {
          const selected = selectedIds.includes(card.id);
          const disabled = !selected && selectedIds.length >= maxCardsPerSide;

          return (
            <button
              key={card.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(card)}
              className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                selected
                  ? "border-white/45 bg-white/12"
                  : "border-white/10 bg-black/25 hover:border-white/25"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-black text-white">{card.name}</h4>
                <span
                  className={`h-3 w-3 rounded-full ${selected ? "bg-lime-300" : "bg-white/20"}`}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {card.description}
              </p>
              {learnMode ? (
                <p className="mt-3 rounded-lg border border-white/10 bg-black/35 p-3 text-sm leading-6 text-slate-300">
                  {card.educationalNote}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LoadoutStep({
  selectedArenaId,
  selectedMegaIds,
  selectedMonadIds,
  setSelectedMegaIds,
  setSelectedMonadIds,
  learnMode,
  startBattle,
  setStep,
}: {
  selectedArenaId: string;
  selectedMegaIds: string[];
  selectedMonadIds: string[];
  setSelectedMegaIds: (ids: string[]) => void;
  setSelectedMonadIds: (ids: string[]) => void;
  learnMode: boolean;
  startBattle: () => void;
  setStep: (step: GameStep) => void;
}) {
  const selectedMegaCards = megaethCards.filter((card) =>
    selectedMegaIds.includes(card.id),
  );
  const selectedMonadCards = monadCards.filter((card) =>
    selectedMonadIds.includes(card.id),
  );
  const megaPreview = buildPreview("MegaETH", selectedMegaCards, selectedArenaId);
  const monadPreview = buildPreview("Monad", selectedMonadCards, selectedArenaId);

  const toggle = (
    card: Card,
    selectedIds: string[],
    setSelectedIds: (ids: string[]) => void,
  ) => {
    if (selectedIds.includes(card.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== card.id));
      return;
    }

    if (selectedIds.length < maxCardsPerSide) {
      setSelectedIds([...selectedIds, card.id]);
    }
  };

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Pick Cards</h2>
          <p className="mt-2 text-slate-300">
            Start with base stats only, or pick up to 4 cards per fighter for a
            more interesting battle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedMegaIds([]);
            setSelectedMonadIds([]);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
        >
          <RotateCcw size={15} />
          Reset Loadout
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CardGrid
          chain="MegaETH"
          cards={megaethCards}
          selectedIds={selectedMegaIds}
          onToggle={(card) => toggle(card, selectedMegaIds, setSelectedMegaIds)}
          learnMode={learnMode}
        />
        <CardGrid
          chain="Monad"
          cards={monadCards}
          selectedIds={selectedMonadIds}
          onToggle={(card) => toggle(card, selectedMonadIds, setSelectedMonadIds)}
          learnMode={learnMode}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <FighterPanel fighter={megaPreview} hp={100} arenaName="preview" />
        <FighterPanel fighter={monadPreview} hp={100} arenaName="preview" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setStep("Arena")}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-200"
        >
          Back to Arena
        </button>
        <button
          type="button"
          onClick={startBattle}
          className="rounded-xl border border-lime-300/40 bg-lime-300/15 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-lime-50 hover:bg-lime-300/22"
        >
          Enter Battle
        </button>
      </div>
    </section>
  );
}

function BattleStep({
  result,
  shownRounds,
  setShownRounds,
  quickSim,
  setStep,
}: {
  result: BattleResult;
  shownRounds: number;
  setShownRounds: (count: number) => void;
  quickSim: () => void;
  setStep: (step: GameStep) => void;
}) {
  const hp = hpAfterRounds(result, shownRounds);
  const lastAction = shownRounds > 0 ? result.rounds[shownRounds - 1] : null;
  const battleDone = shownRounds >= result.rounds.length;

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Fight</h2>
          <p className="mt-2 text-slate-300">
            Step through the match or quick simulate the whole battle.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm font-black text-white">
          Round {Math.min(shownRounds + 1, result.rounds.length)} / {result.rounds.length}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <FighterPanel
          fighter={result.megaFighter}
          hp={hp.MegaETH}
          arenaName={result.arena.name}
        />
        <div className="flex justify-center">
          <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 p-5">
            <Swords className="text-cyan-100" size={30} />
          </div>
        </div>
        <FighterPanel
          fighter={result.monadFighter}
          hp={hp.Monad}
          arenaName={result.arena.name}
        />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        {lastAction ? (
          <>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
              Current action
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">
              {lastAction.attacker} uses {lastAction.actionName}
            </h3>
            <p className="mt-3 text-slate-300">
              {lastAction.flavor} {lastAction.defender} takes{" "}
              <span className="font-black text-white">{lastAction.damage}</span>{" "}
              damage.
            </p>
            <OnchainActionRecorder round={lastAction} />
          </>
        ) : (
          <p className="text-lg font-bold text-slate-200">
            Fighters are loaded. Start the first action when ready.
          </p>
        )}
      </div>
      <details className="rounded-xl border border-white/10 bg-black/30 p-4">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.18em] text-slate-300">
          Battle log
        </summary>
        <div className="mt-3 grid gap-2 text-sm text-slate-300">
          {result.rounds.slice(0, shownRounds).map((round) => (
            <p key={`${round.round}-${round.actionHash}`}>
              Round {round.round}: {round.attacker} hit {round.defender} for{" "}
              {round.damage}.
            </p>
          ))}
        </div>
      </details>
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={quickSim}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-cyan-50"
        >
          <Zap size={16} />
          Quick Simulate
        </button>
        <button
          type="button"
          onClick={() => {
            if (battleDone) {
              setStep("Result");
              return;
            }

            setShownRounds(shownRounds + 1);
          }}
          className="rounded-xl border border-lime-300/40 bg-lime-300/15 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-lime-50"
        >
          {battleDone ? "View Result" : "Next Action"}
        </button>
        <button
          type="button"
          onClick={() => setStep("Loadout")}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-200"
        >
          Edit Loadout
        </button>
      </div>
    </section>
  );
}

function ResultStep({
  result,
  reset,
  rematch,
}: {
  result: BattleResult;
  reset: () => void;
  rematch: () => void;
}) {
  const blocks = resultBlocks(result);
  const title =
    result.winner === "Draw"
      ? "Draw"
      : `${result.winner} wins this arena`;
  const shareText = `${title} in ${result.arena.name}. MegaETH: ${loadoutLabel(
    result.megaFighter.cards,
  )}. Monad: ${loadoutLabel(
    result.monadFighter.cards,
  )}. Contextual simulation, not a universal ranking.`;

  const copy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <section className="grid gap-5">
      <div className="rounded-2xl border border-cyan-300/25 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.18),transparent_35%),rgba(255,255,255,0.04)] p-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
          Result
        </p>
        <h2 className="mt-3 text-4xl font-black text-white">{title}</h2>
        <p className="mt-3 text-lg text-slate-300">{result.arena.name}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Why it happened", blocks.why],
          ["What the other chain was strong at", blocks.other],
          ["What this teaches", blocks.teaches],
        ].map(([heading, body]) => (
          <div
            key={heading}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
          >
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-200">
              {heading}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-orange-300/25 bg-orange-300/10 p-5">
          <h3 className="text-lg font-black text-white">MegaETH loadout</h3>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {loadoutLabel(result.megaFighter.cards)}
          </p>
        </div>
        <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-300/10 p-5">
          <h3 className="text-lg font-black text-white">Monad loadout</h3>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {loadoutLabel(result.monadFighter.cards)}
          </p>
        </div>
      </div>
      <p className="rounded-xl border border-lime-300/20 bg-lime-300/10 p-4 text-sm font-bold text-lime-50">
        This is a contextual simulation, not a universal ranking.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-cyan-50"
        >
          <Clipboard size={16} />
          Copy Result
        </button>
        <button
          type="button"
          onClick={rematch}
          className="rounded-xl border border-lime-300/35 bg-lime-300/10 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-lime-50"
        >
          Run Rematch
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-200"
        >
          New Loadout
        </button>
      </div>
      <OnchainActions result={result} />
    </section>
  );
}

export default function Home() {
  const [step, setStep] = useState<GameStep>("Arena");
  const [learnMode, setLearnMode] = useState(false);
  const [selectedArenaId, setSelectedArenaId] = useState(arenas[0].id);
  const [selectedMegaIds, setSelectedMegaIds] = useState<string[]>([]);
  const [selectedMonadIds, setSelectedMonadIds] = useState<string[]>([]);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [shownRounds, setShownRounds] = useState(0);
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

  const startBattle = () => {
    const battle = simulateBattle(
      selectedArena,
      selectedMegaCards,
      selectedMonadCards,
      createBattleSeed(),
    );

    setResult(battle);
    setShownRounds(0);
    setStep("Battle");
  };

  const quickSim = () => {
    if (!result) return;
    setShownRounds(result.rounds.length);
    setStep("Result");
  };

  const rematch = () => {
    const battle = simulateBattle(
      selectedArena,
      selectedMegaCards,
      selectedMonadCards,
      createBattleSeed(),
    );

    setResult(battle);
    setShownRounds(battle.rounds.length);
    setStep("Result");
  };

  const reset = () => {
    setResult(null);
    setShownRounds(0);
    setSelectedMegaIds([]);
    setSelectedMonadIds([]);
    setStep("Loadout");
  };

  return (
    <LandingGate>
      <main className="min-h-screen bg-[#050508] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,146,60,0.15),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(168,85,247,0.18),transparent_32%),linear-gradient(180deg,#050508,#080812_45%,#050508)]" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <header className="grid gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-100">
                  Blockborne
                </p>
                <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
                  Pick an arena. Build a loadout. Fight.
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setLearnMode((current) => !current)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-[0.16em] ${
                  learnMode
                    ? "border-lime-300/35 bg-lime-300/10 text-lime-50"
                    : "border-white/10 bg-white/[0.04] text-slate-200"
                }`}
              >
                <BookOpen size={16} />
                Learn {learnMode ? "On" : "Off"}
              </button>
            </div>
            <WalletStatus />
            <StepProgress current={step} />
          </header>

          <div className="rounded-3xl border border-white/10 bg-black/45 p-4 shadow-[0_0_70px_rgba(0,0,0,0.35)] sm:p-6">
            {step === "Arena" ? (
              <ArenaStep
                selectedArenaId={selectedArenaId}
                setSelectedArenaId={setSelectedArenaId}
                learnMode={learnMode}
                setStep={setStep}
              />
            ) : null}
            {step === "Loadout" ? (
              <LoadoutStep
                selectedArenaId={selectedArenaId}
                selectedMegaIds={selectedMegaIds}
                selectedMonadIds={selectedMonadIds}
                setSelectedMegaIds={setSelectedMegaIds}
                setSelectedMonadIds={setSelectedMonadIds}
                learnMode={learnMode}
                startBattle={startBattle}
                setStep={setStep}
              />
            ) : null}
            {step === "Battle" && result ? (
              <BattleStep
                result={result}
                shownRounds={shownRounds}
                setShownRounds={setShownRounds}
                quickSim={quickSim}
                setStep={setStep}
              />
            ) : null}
            {step === "Result" && result ? (
              <ResultStep result={result} reset={reset} rematch={rematch} />
            ) : null}
          </div>
        </div>
      </main>
    </LandingGate>
  );
}
