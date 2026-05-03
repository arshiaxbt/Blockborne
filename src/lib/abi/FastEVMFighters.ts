export const fastEVMFightersAbi = [
  {
    type: "function",
    name: "recordBattle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "arenaId", type: "string" },
      { name: "megaethLoadout", type: "string" },
      { name: "monadLoadout", type: "string" },
      { name: "winner", type: "uint8" },
      { name: "megaethScore", type: "uint256" },
      { name: "monadScore", type: "uint256" },
      { name: "battleHash", type: "bytes32" },
    ],
    outputs: [{ name: "battleId", type: "uint256" }],
  },
  {
    type: "event",
    name: "BattleRecorded",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "arenaId", type: "string", indexed: false },
      { name: "winner", type: "uint8", indexed: false },
      { name: "megaethScore", type: "uint256", indexed: false },
      { name: "monadScore", type: "uint256", indexed: false },
      { name: "battleHash", type: "bytes32", indexed: false },
    ],
  },
] as const;
