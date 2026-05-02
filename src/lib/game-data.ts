export type Chain = "MegaETH" | "Monad";

export type Stats = {
  speed: number;
  throughput: number;
  security: number;
  decentralization: number;
  composability: number;
  ux: number;
  reliability: number;
};

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type Card = {
  id: string;
  chain: Chain;
  name: string;
  subtitle: string;
  description: string;
  educationalNote: string;
  effects: Stats;
  downsides: Partial<Stats>;
  tags: string[];
  maxCopies: number;
  rarity: Rarity;
};

export type Arena = {
  id: string;
  name: string;
  description: string;
  statRationale: string;
  weights: Stats;
  educationalNote: string;
};

export type FighterProfile = {
  chain: Chain;
  layer: string;
  gasToken: string;
  tagline: string;
  summary: string;
  baseStats: Stats;
  strengths: string[];
  tradeoffs: string[];
};

export const baseFighters: Record<Chain, FighterProfile> = {
  MegaETH: {
    chain: "MegaETH",
    layer: "Ethereum L2",
    gasToken: "ETH",
    tagline: "Realtime Ethereum L2 focused on high-frequency UX",
    summary:
      "MegaETH is framed here as an OP Stack-based Ethereum L2 using a single high-performance sequencer, ETH gas, real-time state streaming, globally distributed RPC nodes, EigenDA data availability, Ethereum settlement, and Kailua proof / ZK fraud proof framing.",
    baseStats: {
      speed: 8,
      throughput: 7,
      security: 7,
      decentralization: 5,
      composability: 7,
      ux: 9,
      reliability: 7,
    },
    strengths: [
      "Roughly 10ms mini-blocks and around 1s EVM blocks support realtime app feedback.",
      "Ethereum settlement and ETH gas keep the design close to Ethereum user and developer expectations.",
      "Realtime state streaming and globally distributed RPC nodes are strong fits for games, perps, consumer apps, and high-frequency UX.",
    ],
    tradeoffs: [
      "Single sequencer design creates sequencer centralization tradeoffs.",
      "L2 trust assumptions and data availability / proof complexity matter for risk analysis.",
    ],
  },
  Monad: {
    chain: "Monad",
    layer: "High-performance EVM Layer 1",
    gasToken: "MON",
    tagline: "Parallel EVM L1 focused on throughput and native execution",
    summary:
      "Monad is framed here as a high-performance EVM Layer 1 using MON gas, MonadBFT, RaptorCast, optimistic parallel execution, asynchronous execution, MonadDB, and EVM/RPC compatibility with around a 400ms block target and 800ms finality target.",
    baseStats: {
      speed: 7,
      throughput: 9,
      security: 6,
      decentralization: 7,
      composability: 7,
      ux: 7,
      reliability: 6,
    },
    strengths: [
      "Optimistic parallel execution, asynchronous execution, and MonadDB target high-throughput EVM workloads.",
      "MonadBFT, RaptorCast, and L1-native execution are strong fits for high-throughput DeFi and parallelizable apps.",
      "EVM/RPC compatibility supports existing EVM builders who need more performance.",
    ],
    tradeoffs: [
      "As a newer L1, ecosystem, liquidity, validator set, and security maturity need time to bootstrap.",
      "Parallelizable workloads benefit most; shared-state app design can still become a bottleneck.",
    ],
  },
};

export const megaethCards: Card[] = [
  {
    id: "megaeth-10ms-mini-blocks",
    chain: "MegaETH",
    name: "10ms Mini Blocks",
    subtitle: "Realtime interaction loop",
    description:
      "Leans into MegaETH's roughly 10ms mini-block framing for apps that need fast UI feedback before normal EVM block cadence.",
    educationalNote:
      "Mini-blocks are a fast update layer: users can see very quick feedback while the chain still produces normal EVM blocks around a slower cadence.",
    effects: {
      speed: 4,
      throughput: 1,
      security: 0,
      decentralization: 0,
      composability: 0,
      ux: 3,
      reliability: 1,
    },
    downsides: {
      decentralization: -1,
      reliability: -1,
    },
    tags: ["mini-blocks", "realtime", "games", "ux"],
    maxCopies: 1,
    rarity: "legendary",
  },
  {
    id: "megaeth-real-time-state-streaming",
    chain: "MegaETH",
    name: "Real-Time State Streaming",
    subtitle: "Live app state updates",
    description:
      "Emphasizes real-time state streaming for responsive games, trading views, consumer apps, and high-frequency interfaces.",
    educationalNote:
      "State streaming means apps can subscribe to fresh chain state instead of waiting for slower polling loops, which can make interfaces feel live.",
    effects: {
      speed: 2,
      throughput: 1,
      security: 0,
      decentralization: 0,
      composability: 1,
      ux: 4,
      reliability: 1,
    },
    downsides: {
      reliability: -1,
    },
    tags: ["state-streaming", "consumer", "perps", "ux"],
    maxCopies: 1,
    rarity: "epic",
  },
  {
    id: "megaeth-single-sequencer-overdrive",
    chain: "MegaETH",
    name: "Single Sequencer Overdrive",
    subtitle: "Specialized execution lane",
    description:
      "Uses the single high-performance sequencer assumption to optimize ordering and execution for latency-sensitive apps.",
    educationalNote:
      "A single optimized sequencer can reduce coordination overhead and improve speed, but it also concentrates sequencing power in one place.",
    effects: {
      speed: 4,
      throughput: 3,
      security: 0,
      decentralization: 0,
      composability: 0,
      ux: 2,
      reliability: 1,
    },
    downsides: {
      decentralization: -3,
      security: -1,
    },
    tags: ["sequencer", "latency", "throughput"],
    maxCopies: 1,
    rarity: "rare",
  },
  {
    id: "megaeth-ethereum-settlement",
    chain: "MegaETH",
    name: "Ethereum Settlement",
    subtitle: "L2 security anchor",
    description:
      "Highlights MegaETH's Ethereum settlement path and ETH gas alignment for builders who value Ethereum ecosystem continuity.",
    educationalNote:
      "Ethereum settlement means the L2 ultimately anchors important guarantees back to Ethereum, while ETH gas keeps the user model familiar.",
    effects: {
      speed: 0,
      throughput: 0,
      security: 3,
      decentralization: 1,
      composability: 3,
      ux: 1,
      reliability: 2,
    },
    downsides: {
      speed: -1,
    },
    tags: ["ethereum", "settlement", "eth-gas", "l2"],
    maxCopies: 1,
    rarity: "epic",
  },
  {
    id: "megaeth-eigenda-data-boost",
    chain: "MegaETH",
    name: "EigenDA Data Boost",
    subtitle: "Data availability scaling",
    description:
      "Represents EigenDA data availability as a scaling input for high-volume L2 usage while keeping DA assumptions explicit.",
    educationalNote:
      "Data availability systems help publish enough transaction data for verification, but they add assumptions developers should understand.",
    effects: {
      speed: 1,
      throughput: 3,
      security: 1,
      decentralization: 0,
      composability: 1,
      ux: 1,
      reliability: 2,
    },
    downsides: {
      security: -1,
      reliability: -1,
    },
    tags: ["eigenda", "data-availability", "scaling"],
    maxCopies: 1,
    rarity: "rare",
  },
  {
    id: "megaeth-global-rpc-mesh",
    chain: "MegaETH",
    name: "Global RPC Mesh",
    subtitle: "Distributed read access",
    description:
      "Models globally distributed RPC nodes as a UX and reliability boost for geographically diverse users.",
    educationalNote:
      "Distributed RPC nodes put read access closer to users, which can reduce app latency even when the underlying chain rules are unchanged.",
    effects: {
      speed: 1,
      throughput: 0,
      security: 0,
      decentralization: 1,
      composability: 1,
      ux: 3,
      reliability: 3,
    },
    downsides: {},
    tags: ["rpc", "global", "reliability", "consumer"],
    maxCopies: 1,
    rarity: "common",
  },
  {
    id: "megaeth-kailua-proof-shield",
    chain: "MegaETH",
    name: "Kailua Proof Shield",
    subtitle: "ZK fraud proof framing",
    description:
      "Adds Kailua proof system / ZK fraud proof framing to represent stronger verification narratives for the L2 stack.",
    educationalNote:
      "Proof systems help verify that execution was handled correctly; stronger proof designs can improve trust, but may add technical complexity.",
    effects: {
      speed: 0,
      throughput: 0,
      security: 3,
      decentralization: 1,
      composability: 1,
      ux: 0,
      reliability: 2,
    },
    downsides: {
      speed: -1,
      reliability: -1,
    },
    tags: ["proofs", "kailua", "zk-fraud-proof", "security"],
    maxCopies: 1,
    rarity: "epic",
  },
  {
    id: "megaeth-usdm-fee-ux",
    chain: "MegaETH",
    name: "USDm Fee UX",
    subtitle: "Consumer-friendly fee feel",
    description:
      "Represents stable-feeling fee UX as an app-layer advantage for mainstream users while preserving ETH gas as the core chain framing.",
    educationalNote:
      "Fee abstraction can make apps easier to use by hiding volatility or complexity, but it is an app-layer UX choice rather than the base gas asset.",
    effects: {
      speed: 0,
      throughput: 0,
      security: 0,
      decentralization: 0,
      composability: 1,
      ux: 4,
      reliability: 1,
    },
    downsides: {
      composability: -1,
    },
    tags: ["fees", "consumer", "ux"],
    maxCopies: 1,
    rarity: "common",
  },
];

export const monadCards: Card[] = [
  {
    id: "monad-parallel-execution",
    chain: "Monad",
    name: "Parallel Execution",
    subtitle: "Optimistic multi-lane EVM",
    description:
      "Represents Monad's optimistic parallel execution model for workloads that can process independent transactions efficiently.",
    educationalNote:
      "Parallel execution lets independent transactions run at the same time. It helps most when apps avoid many transactions fighting over the same state.",
    effects: {
      speed: 2,
      throughput: 5,
      security: 0,
      decentralization: 0,
      composability: 1,
      ux: 1,
      reliability: 1,
    },
    downsides: {
      composability: -1,
      reliability: -1,
    },
    tags: ["parallel-execution", "throughput", "defi"],
    maxCopies: 1,
    rarity: "legendary",
  },
  {
    id: "monad-monadb-engine",
    chain: "Monad",
    name: "MonadDB Engine",
    subtitle: "Purpose-built state database",
    description:
      "Models MonadDB as a state access and execution efficiency boost for performance-sensitive EVM applications.",
    educationalNote:
      "A purpose-built state database can speed up reads and writes, which matters because state access is often a bottleneck in high-throughput chains.",
    effects: {
      speed: 2,
      throughput: 4,
      security: 0,
      decentralization: 0,
      composability: 0,
      ux: 1,
      reliability: 2,
    },
    downsides: {
      decentralization: -1,
    },
    tags: ["monaddb", "state", "performance"],
    maxCopies: 1,
    rarity: "epic",
  },
  {
    id: "monad-async-execution-pipeline",
    chain: "Monad",
    name: "Async Execution Pipeline",
    subtitle: "Execution decoupling",
    description:
      "Uses asynchronous execution to improve pipeline efficiency while reminding players that app design still shapes outcomes.",
    educationalNote:
      "Asynchronous execution separates parts of the pipeline so the system can keep work moving instead of waiting for every step to finish serially.",
    effects: {
      speed: 2,
      throughput: 3,
      security: 0,
      decentralization: 0,
      composability: 0,
      ux: 2,
      reliability: 1,
    },
    downsides: {
      composability: -1,
    },
    tags: ["async-execution", "pipeline", "performance"],
    maxCopies: 1,
    rarity: "rare",
  },
  {
    id: "monad-monadbft-guard",
    chain: "Monad",
    name: "MonadBFT Guard",
    subtitle: "Consensus protection",
    description:
      "Highlights MonadBFT as the consensus layer for a high-performance L1 that still has to prove itself over time.",
    educationalNote:
      "Consensus decides ordering and agreement among validators. MonadBFT is part of Monad's approach to fast L1 coordination.",
    effects: {
      speed: 1,
      throughput: 1,
      security: 3,
      decentralization: 1,
      composability: 0,
      ux: 0,
      reliability: 3,
    },
    downsides: {
      throughput: -1,
    },
    tags: ["monadbft", "consensus", "security"],
    maxCopies: 1,
    rarity: "epic",
  },
  {
    id: "monad-raptorcast-broadcast",
    chain: "Monad",
    name: "RaptorCast Broadcast",
    subtitle: "Efficient message propagation",
    description:
      "Represents RaptorCast as a networking advantage for fast block propagation and validator communication.",
    educationalNote:
      "Fast broadcast helps validators receive messages quickly, which can support lower latency and smoother consensus under load.",
    effects: {
      speed: 2,
      throughput: 2,
      security: 0,
      decentralization: 1,
      composability: 0,
      ux: 1,
      reliability: 2,
    },
    downsides: {},
    tags: ["raptorcast", "networking", "validators"],
    maxCopies: 1,
    rarity: "rare",
  },
  {
    id: "monad-l1-validator-armor",
    chain: "Monad",
    name: "L1 Validator Armor",
    subtitle: "Native security path",
    description:
      "Leans into Monad's L1-native validator model and decentralization goals, while keeping bootstrapping risk visible.",
    educationalNote:
      "An L1 validator set provides native settlement and security assumptions, but new networks need time to mature their validator ecosystem.",
    effects: {
      speed: 0,
      throughput: 0,
      security: 2,
      decentralization: 3,
      composability: 1,
      ux: 0,
      reliability: 1,
    },
    downsides: {
      ux: -1,
      reliability: -1,
    },
    tags: ["l1", "validators", "decentralization"],
    maxCopies: 1,
    rarity: "rare",
  },
  {
    id: "monad-evm-compatibility",
    chain: "Monad",
    name: "EVM Compatibility",
    subtitle: "Familiar builder surface",
    description:
      "Boosts app portability through EVM/RPC compatibility for teams that want performance without abandoning EVM tooling.",
    educationalNote:
      "EVM/RPC compatibility means many Ethereum-style tools and contracts can transfer more easily, reducing migration friction for builders.",
    effects: {
      speed: 0,
      throughput: 1,
      security: 0,
      decentralization: 0,
      composability: 4,
      ux: 2,
      reliability: 1,
    },
    downsides: {},
    tags: ["evm", "rpc", "tooling", "builders"],
    maxCopies: 1,
    rarity: "common",
  },
  {
    id: "monad-fast-finality",
    chain: "Monad",
    name: "Fast Finality",
    subtitle: "400ms blocks, 800ms finality target",
    description:
      "Represents Monad's around 400ms block target and 800ms finality target for apps that need quick L1 confirmation.",
    educationalNote:
      "Fast blocks and fast finality can make L1 apps feel responsive, especially when users need confidence that an action has settled quickly.",
    effects: {
      speed: 4,
      throughput: 1,
      security: 1,
      decentralization: 0,
      composability: 0,
      ux: 3,
      reliability: 1,
    },
    downsides: {
      decentralization: -1,
    },
    tags: ["finality", "blocks", "l1", "ux"],
    maxCopies: 1,
    rarity: "legendary",
  },
];

export const arenas: Arena[] = [
  {
    id: "realtime-gaming-arena",
    name: "Realtime Gaming Arena",
    description:
      "A twitchy game loop where feedback speed, UX, and reliable read access matter more than raw settlement purity.",
    statRationale:
      "Speed and UX are weighted heavily because games need quick feedback; reliability matters so players see consistent state during fast interactions.",
    weights: {
      speed: 1.7,
      throughput: 1,
      security: 0.7,
      decentralization: 0.6,
      composability: 0.8,
      ux: 1.6,
      reliability: 1.2,
    },
    educationalNote:
      "Realtime games can value low-latency state updates and smooth UX, but that does not make one chain universally better for every game design.",
  },
  {
    id: "perps-arena",
    name: "Perps Arena",
    description:
      "A trading arena where fast updates, throughput, reliability, and liquidation-sensitive UX are under pressure.",
    statRationale:
      "Perps reward speed, throughput, UX, and reliability because stale state or slow updates can affect trading and liquidation workflows.",
    weights: {
      speed: 1.5,
      throughput: 1.4,
      security: 1,
      decentralization: 0.7,
      composability: 1,
      ux: 1.4,
      reliability: 1.3,
    },
    educationalNote:
      "Perps care about execution feel and data freshness, while settlement, oracle design, and risk controls remain separate concerns.",
  },
  {
    id: "consumer-app-arena",
    name: "Consumer App Arena",
    description:
      "A mainstream UX test for apps that need fast confirmation feel, readable fees, and resilient access during spikes.",
    statRationale:
      "Consumer apps weight UX and reliability highly because mainstream users notice latency, failed reads, and confusing fee behavior quickly.",
    weights: {
      speed: 1.2,
      throughput: 1.2,
      security: 0.8,
      decentralization: 0.7,
      composability: 1,
      ux: 1.8,
      reliability: 1.4,
    },
    educationalNote:
      "Consumer apps often reward predictability and smooth interfaces, but infrastructure assumptions still matter underneath.",
  },
  {
    id: "l1-purist-arena",
    name: "L1 Purist Arena",
    description:
      "A base-layer preference test that gives extra weight to L1-native validation and direct chain security assumptions.",
    statRationale:
      "Security and decentralization receive extra weight because this arena favors direct L1 validation and simpler settlement assumptions.",
    weights: {
      speed: 0.8,
      throughput: 1,
      security: 1.5,
      decentralization: 1.5,
      composability: 1,
      ux: 0.7,
      reliability: 1.1,
    },
    educationalNote:
      "L1-native apps may prioritize validator and settlement assumptions differently than L2-centric apps.",
  },
  {
    id: "decentralization-arena",
    name: "Decentralization Arena",
    description:
      "A governance and infrastructure arena where decentralization, security, and reliability outweigh raw speed.",
    statRationale:
      "Decentralization and security lead here because infrastructure assumptions, validator distribution, and proof paths matter more than speed alone.",
    weights: {
      speed: 0.6,
      throughput: 0.8,
      security: 1.6,
      decentralization: 1.8,
      composability: 0.9,
      ux: 0.6,
      reliability: 1.2,
    },
    educationalNote:
      "Sequencer, validator, data availability, and proof assumptions are different dimensions; no single stat captures all decentralization tradeoffs.",
  },
  {
    id: "defi-throughput-arena",
    name: "DeFi Throughput Arena",
    description:
      "A high-volume DeFi arena where throughput, composability, security, and reliability carry the fight.",
    statRationale:
      "Throughput and composability matter because DeFi workloads often depend on many transactions interacting with shared liquidity and protocols.",
    weights: {
      speed: 1,
      throughput: 1.8,
      security: 1.2,
      decentralization: 1,
      composability: 1.5,
      ux: 0.9,
      reliability: 1.2,
    },
    educationalNote:
      "High-throughput DeFi can benefit from parallel execution and strong databases, but shared-state contention and liquidity depth still matter.",
  },
  {
    id: "stress-test-arena",
    name: "Stress Test Arena",
    description:
      "A hostile load test where every stat matters, and cards with hidden complexity can create meaningful drawbacks.",
    statRationale:
      "Reliability leads because stress tests expose bottlenecks across RPC, execution, networking, data availability, and app design.",
    weights: {
      speed: 1.2,
      throughput: 1.4,
      security: 1.2,
      decentralization: 1.1,
      composability: 1.1,
      ux: 1.1,
      reliability: 1.6,
    },
    educationalNote:
      "Stress tests expose bottlenecks across networking, execution, RPC, data availability, and app design rather than proving universal superiority.",
  },
];
