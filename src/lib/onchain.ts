import {
  encodeAbiParameters,
  isAddress,
  keccak256,
  toBytes,
  type Address,
  type Hex,
} from "viem";
import type { Card } from "./game-data";

export type BattleHashParams = {
  arenaId: string;
  megaethLoadout: string;
  monadLoadout: string;
  winner: string;
  megaethScore: number;
  monadScore: number;
  seed: string;
};

export type ActionHashParams = {
  battleSessionId: Hex;
  fighter: string;
  actionName: string;
  actionType: string;
  round: number;
  damage: number;
};

export function winnerToEnum(winner: string): number {
  if (winner === "MegaETH") {
    return 0;
  }

  if (winner === "Monad") {
    return 1;
  }

  return 2;
}

export function loadoutToString(cards: Card[]): string {
  return cards.length
    ? cards.map((card) => card.name).join(" + ")
    : "Baseline kit";
}

export function createBattleHash(params: BattleHashParams): Hex {
  const seedHash = keccak256(toBytes(params.seed));

  return keccak256(
    encodeAbiParameters(
      [
        { name: "arenaId", type: "string" },
        { name: "megaethLoadout", type: "string" },
        { name: "monadLoadout", type: "string" },
        { name: "winner", type: "uint8" },
        { name: "megaethScore", type: "uint256" },
        { name: "monadScore", type: "uint256" },
        { name: "seedHash", type: "bytes32" },
      ],
      [
        params.arenaId,
        params.megaethLoadout,
        params.monadLoadout,
        winnerToEnum(params.winner),
        BigInt(params.megaethScore),
        BigInt(params.monadScore),
        seedHash,
      ],
    ),
  );
}

export function createBattleSessionId(seed: string): Hex {
  return keccak256(toBytes(`blockborne-session:${seed}`));
}

export function createActionHash(params: ActionHashParams): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { name: "battleSessionId", type: "bytes32" },
        { name: "fighter", type: "string" },
        { name: "actionName", type: "string" },
        { name: "actionType", type: "string" },
        { name: "round", type: "uint256" },
        { name: "damage", type: "uint256" },
      ],
      [
        params.battleSessionId,
        params.fighter,
        params.actionName,
        params.actionType,
        BigInt(params.round),
        BigInt(params.damage),
      ],
    ),
  );
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  if (chainId === 10143) {
    return `https://monad-testnet.socialscan.io/tx/${txHash}`;
  }

  if (chainId === 6343) {
    return `https://www.megaexplorer.xyz/tx/${txHash}`;
  }

  return "";
}

export function getBattleContractAddress(chainId: number): Address | null {
  const rawAddress =
    chainId === 10143
      ? process.env.NEXT_PUBLIC_MONAD_BATTLE_CONTRACT
      : chainId === 6343
        ? process.env.NEXT_PUBLIC_MEGAETH_BATTLE_CONTRACT
        : undefined;

  if (!rawAddress || !isAddress(rawAddress)) {
    return null;
  }

  return rawAddress;
}
