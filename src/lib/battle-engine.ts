import {
  baseFighters,
  type Arena,
  type Card,
  type Chain,
  type FighterProfile,
  type Stats,
} from "./game-data";

export type BattleFighter = FighterProfile & {
  hp: number;
  cards: Card[];
  finalStats: Stats;
  arenaScore: number;
};

export type BattleRound = {
  round: number;
  attacker: Chain;
  defender: Chain;
  damage: number;
  attackerHp: number;
  defenderHp: number;
  flavor: string;
};

export type BattleResult = {
  winner: Chain | "Draw";
  megaScore: number;
  monadScore: number;
  arena: Arena;
  megaFighter: BattleFighter;
  monadFighter: BattleFighter;
  rounds: BattleRound[];
  log: string[];
  explanation: string;
  keyFactors: string[];
  tradeoffs: string[];
};

type RandomSource = () => number;

const maxRounds = 8;
const startingHp = 100;
const drawHpMargin = 3;

const emptyStats: Stats = {
  speed: 0,
  throughput: 0,
  security: 0,
  decentralization: 0,
  composability: 0,
  ux: 0,
  reliability: 0,
};

const statLabels: Record<keyof Stats, string> = {
  speed: "Speed",
  throughput: "Throughput",
  security: "Security",
  decentralization: "Decentralization",
  composability: "Composability",
  ux: "UX",
  reliability: "Reliability",
};

const statKeys = Object.keys(emptyStats) as (keyof Stats)[];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSeed(seed: string | number) {
  const seedString = String(seed);
  let hash = 2166136261;

  for (let index = 0; index < seedString.length; index += 1) {
    hash ^= seedString.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRng(seed?: string | number): RandomSource {
  let state = normalizeSeed(seed ?? "fastevm-fighters-default-seed");

  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function formatHp(value: number) {
  return Math.max(0, Math.round(value));
}

function cardStatDelta(card: Card, stat: keyof Stats) {
  return card.effects[stat] + (card.downsides[stat] ?? 0);
}

function cardArenaContribution(card: Card, arena: Arena) {
  return statKeys.reduce(
    (total, stat) => total + cardStatDelta(card, stat) * arena.weights[stat],
    0,
  );
}

function describeCardDownside(card: Card) {
  const negativeStats = statKeys.filter((stat) => cardStatDelta(card, stat) < 0);

  if (!negativeStats.length) {
    return `${card.chain}: ${card.name} adds ${card.tags
      .slice(0, 2)
      .join(" / ")} without an explicit stat penalty.`;
  }

  return `${card.chain}: ${card.name} pressures ${negativeStats
    .map((stat) => statLabels[stat].toLowerCase())
    .join(" and ")}.`;
}

function topWeightedStats(stats: Stats, arena: Arena, count = 2) {
  return [...statKeys]
    .sort(
      (left, right) =>
        stats[right] * arena.weights[right] - stats[left] * arena.weights[left],
    )
    .slice(0, count);
}

function topContributingCards(cards: Card[], arena: Arena, count = 2) {
  return [...cards]
    .map((card) => ({
      card,
      contribution: cardArenaContribution(card, arena),
    }))
    .sort((left, right) => right.contribution - left.contribution)
    .slice(0, count);
}

function lessWeightedStrength(fighter: BattleFighter, arena: Arena) {
  const maxWeight = Math.max(...statKeys.map((stat) => arena.weights[stat]));

  return [...statKeys].sort((left, right) => {
    const rightValue =
      fighter.finalStats[right] * (maxWeight - arena.weights[right]);
    const leftValue =
      fighter.finalStats[left] * (maxWeight - arena.weights[left]);
    return rightValue - leftValue;
  })[0];
}

function selectFlavorCard(
  attacker: BattleFighter,
  arena: Arena,
  rng: RandomSource,
) {
  if (!attacker.cards.length) {
    return `${attacker.chain} leans on its baseline ${attacker.layer} profile.`;
  }

  const topCards = topContributingCards(attacker.cards, arena, 3);
  const selected = topCards[Math.floor(rng() * topCards.length)]?.card;

  if (!selected) {
    return `${attacker.chain} presses with baseline execution.`;
  }

  return `${selected.name} triggers ${selected.subtitle.toLowerCase()}.`;
}

function selectAttacker(
  megaFighter: BattleFighter,
  monadFighter: BattleFighter,
  rng: RandomSource,
) {
  const megaInitiative = megaFighter.finalStats.speed * 1.6 + rng() * 8;
  const monadInitiative = monadFighter.finalStats.speed * 1.6 + rng() * 8;
  return megaInitiative >= monadInitiative ? "MegaETH" : "Monad";
}

function calculateDamage(
  attacker: BattleFighter,
  defender: BattleFighter,
  arena: Arena,
  rng: RandomSource,
) {
  const attackPressure =
    attacker.arenaScore * 0.16 +
    attacker.finalStats.throughput * 0.65 +
    attacker.finalStats.speed * 0.55 +
    attacker.finalStats.ux * 0.35;
  const defensePressure =
    defender.finalStats.security * 0.55 +
    defender.finalStats.decentralization * 0.35 +
    defender.finalStats.reliability * 0.45;
  const variance = rng() * 5 - 2;

  return Math.round(clamp(8 + attackPressure - defensePressure + variance, 5, 34));
}

export function applyCardsToFighter(
  fighter: FighterProfile,
  selectedCards: Card[],
): BattleFighter {
  const finalStats = selectedCards.reduce(
    (stats, card) => {
      statKeys.forEach((stat) => {
        stats[stat] = clamp(stats[stat] + cardStatDelta(card, stat), 0, 150);
      });
      return stats;
    },
    { ...fighter.baseStats },
  );

  return {
    ...fighter,
    hp: startingHp,
    cards: selectedCards,
    finalStats,
    arenaScore: 0,
  };
}

export function calculateArenaScore(fighter: BattleFighter, arena: Arena) {
  return Math.round(
    statKeys.reduce(
      (score, stat) => score + fighter.finalStats[stat] * arena.weights[stat],
      0,
    ),
  );
}

export function explainBattleResult(result: Omit<BattleResult, "explanation">) {
  const winningFighter =
    result.winner === "MegaETH"
      ? result.megaFighter
      : result.winner === "Monad"
        ? result.monadFighter
        : result.megaFighter.hp >= result.monadFighter.hp
          ? result.megaFighter
          : result.monadFighter;
  const losingFighter =
    winningFighter.chain === "MegaETH" ? result.monadFighter : result.megaFighter;
  const topStats = topWeightedStats(winningFighter.finalStats, result.arena);
  const topCards = topContributingCards(winningFighter.cards, result.arena);
  const cardText = topCards.length
    ? topCards.map(({ card }) => card.name).join(" and ")
    : `${winningFighter.chain}'s baseline profile`;
  const lessWeightedStat = lessWeightedStrength(losingFighter, result.arena);
  const outcomeText =
    result.winner === "Draw"
      ? "ended in a draw"
      : `${result.winner} won the arena`;

  return `${result.arena.name} ${outcomeText}. The top weighted stats were ${topStats
    .map((stat) => statLabels[stat].toLowerCase())
    .join(" and ")}, with ${cardText} contributing most for the leading side. ${
    losingFighter.chain
  } still showed strength in ${statLabels[
    lessWeightedStat
  ].toLowerCase()}, but this arena weighted that less heavily than the deciding factors. This is a neutral educational simulation, not financial advice or a universal chain ranking.`;
}

export function simulateBattle(
  arena: Arena,
  selectedMegaCards: Card[],
  selectedMonadCards: Card[],
  seed?: string | number,
): BattleResult {
  const rng = createSeededRng(seed);
  const megaFighter = applyCardsToFighter(
    baseFighters.MegaETH,
    selectedMegaCards,
  );
  const monadFighter = applyCardsToFighter(baseFighters.Monad, selectedMonadCards);

  megaFighter.arenaScore = calculateArenaScore(megaFighter, arena);
  monadFighter.arenaScore = calculateArenaScore(monadFighter, arena);

  const rounds: BattleRound[] = [];

  for (let round = 1; round <= maxRounds; round += 1) {
    if (megaFighter.hp <= 0 || monadFighter.hp <= 0) {
      break;
    }

    const attackerChain = selectAttacker(megaFighter, monadFighter, rng);
    const attacker =
      attackerChain === "MegaETH" ? megaFighter : monadFighter;
    const defender =
      attackerChain === "MegaETH" ? monadFighter : megaFighter;
    const damage = calculateDamage(attacker, defender, arena, rng);
    const flavor = selectFlavorCard(attacker, arena, rng);

    defender.hp = formatHp(defender.hp - damage);

    rounds.push({
      round,
      attacker: attacker.chain,
      defender: defender.chain,
      damage,
      attackerHp: formatHp(attacker.hp),
      defenderHp: formatHp(defender.hp),
      flavor,
    });
  }

  const hpGap = Math.abs(megaFighter.hp - monadFighter.hp);
  const winner: Chain | "Draw" =
    megaFighter.hp > 0 && monadFighter.hp <= 0
      ? "MegaETH"
      : monadFighter.hp > 0 && megaFighter.hp <= 0
        ? "Monad"
        : hpGap <= drawHpMargin
          ? "Draw"
          : megaFighter.hp > monadFighter.hp
            ? "MegaETH"
            : "Monad";
  const leadingFighter =
    winner === "MegaETH"
      ? megaFighter
      : winner === "Monad"
        ? monadFighter
        : megaFighter.hp >= monadFighter.hp
          ? megaFighter
          : monadFighter;
  const keyFactors = topWeightedStats(leadingFighter.finalStats, arena).map(
    (stat) => statLabels[stat],
  );

  const partialResult: Omit<BattleResult, "explanation"> = {
    winner,
    megaScore: megaFighter.arenaScore,
    monadScore: monadFighter.arenaScore,
    arena,
    megaFighter,
    monadFighter,
    rounds,
    log: [
      `${arena.name} loaded: ${arena.educationalNote}`,
      `MegaETH enters with ${selectedMegaCards.length || "no"} feature ${
        selectedMegaCards.length === 1 ? "card" : "cards"
      }: ${selectedMegaCards.map((card) => card.name).join(", ") || "baseline kit"}.`,
      `Monad enters with ${selectedMonadCards.length || "no"} feature ${
        selectedMonadCards.length === 1 ? "card" : "cards"
      }: ${selectedMonadCards.map((card) => card.name).join(", ") || "baseline kit"}.`,
      ...rounds.map(
        (round) =>
          `Round ${round.round}: ${round.attacker} hits ${round.defender} for ${round.damage}. ${round.flavor} ${round.defender} HP: ${round.defenderHp}.`,
      ),
      winner === "Draw"
        ? `Result: draw after ${rounds.length} rounds. MegaETH HP ${formatHp(
            megaFighter.hp,
          )}, Monad HP ${formatHp(monadFighter.hp)}.`
        : `Result: ${winner} wins ${arena.name}. MegaETH HP ${formatHp(
            megaFighter.hp,
          )}, Monad HP ${formatHp(monadFighter.hp)}.`,
    ],
    keyFactors,
    tradeoffs: [
      ...megaFighter.cards.map(describeCardDownside),
      ...monadFighter.cards.map(describeCardDownside),
      `MegaETH baseline: ${baseFighters.MegaETH.tradeoffs[0]}`,
      `Monad baseline: ${baseFighters.Monad.tradeoffs[0]}`,
    ],
  };

  return {
    ...partialResult,
    explanation: explainBattleResult(partialResult),
  };
}
