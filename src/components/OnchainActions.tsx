"use client";

import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type Chain,
  type EIP1193Provider,
  type Hash,
} from "viem";
import { fastEVMFightersAbi } from "@/lib/abi/FastEVMFighters";
import {
  isMegaethRpcConfigured,
  megaethTestnet,
  monadTestnet,
} from "@/lib/chains";
import type { BattleResult } from "@/lib/battle-engine";
import {
  createBattleHash,
  getBattleContractAddress,
  getExplorerTxUrl,
  loadoutToString,
  winnerToEnum,
} from "@/lib/onchain";

type ChainKey = "monad" | "megaeth";
type RecordTarget = ChainKey | "both";
type RecordStatus =
  | "idle"
  | "switching"
  | "waiting-signature"
  | "pending-tx"
  | "success"
  | "error";

type EthereumWallet = {
  address: string;
  type: "ethereum";
  walletClientType: string;
  switchChain: (targetChainId: `0x${string}` | number) => Promise<void>;
  getEthereumProvider: () => Promise<unknown>;
};

type ChainRecord = {
  status: RecordStatus;
  hash: Hash | null;
  error: string | null;
};

const initialRecordState: Record<ChainKey, ChainRecord> = {
  monad: {
    status: "idle",
    hash: null,
    error: null,
  },
  megaeth: {
    status: "idle",
    hash: null,
    error: null,
  },
};

const statusCopy: Record<RecordStatus, string> = {
  idle: "Idle",
  switching: "Switching network",
  "waiting-signature": "Waiting for signature",
  "pending-tx": "Pending",
  success: "Success",
  error: "Error",
};

function getReadableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("rejected")) {
    return "Transaction rejected in wallet.";
  }

  if (lower.includes("insufficient funds")) {
    return "Insufficient testnet funds for gas.";
  }

  if (lower.includes("chain") || lower.includes("network")) {
    return "Wallet is on the wrong chain or could not switch networks.";
  }

  if (lower.includes("execution reverted")) {
    return "Contract call reverted. Check the battle data and contract address.";
  }

  return message || "Onchain recording failed.";
}

function isEmbeddedEthereumWallet(wallet: unknown): wallet is EthereumWallet {
  const candidate = wallet as Partial<EthereumWallet>;

  return (
    candidate.type === "ethereum" &&
    typeof candidate.address === "string" &&
    typeof candidate.switchChain === "function" &&
    typeof candidate.getEthereumProvider === "function" &&
    (candidate.walletClientType === "privy" ||
      candidate.walletClientType === "privy-v2")
  );
}

function chainForKey(key: ChainKey) {
  return key === "monad" ? monadTestnet : megaethTestnet;
}

function setChainRecord(
  setter: React.Dispatch<React.SetStateAction<Record<ChainKey, ChainRecord>>>,
  key: ChainKey,
  patch: Partial<ChainRecord>,
) {
  setter((current) => ({
    ...current,
    [key]: {
      ...current[key],
      ...patch,
    },
  }));
}

function StatusBadge({ status }: { status: RecordStatus }) {
  const color =
    status === "success"
      ? "border-[#90D79F]/35 bg-[#90D79F]/10 text-[#ECE8E8]"
      : status === "error"
        ? "border-red-300/35 bg-red-300/10 text-red-100"
        : status === "idle"
          ? "border-white/10 bg-white/[0.04] text-slate-300"
          : "border-[#70BAD2]/35 bg-[#70BAD2]/10 text-[#ECE8E8]";

  return (
    <span
      className={`rounded px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] ${color}`}
    >
      {statusCopy[status]}
    </span>
  );
}

function ChainStatusCard({
  chainKey,
  record,
}: {
  chainKey: ChainKey;
  record: ChainRecord;
}) {
  const chain = chainForKey(chainKey);
  const accent =
    chainKey === "monad"
      ? "border-[#836EF9]/25 bg-[#836EF9]/10 text-[#FBFAF9]"
      : "border-[#F5AF94]/25 bg-[#F5AF94]/10 text-[#ECE8E8]";

  return (
    <div className={`rounded-md border p-4 ${accent}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            {chainKey === "megaeth" ? "MegaETH side" : "Monad side"}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Final battle record on {chain.name}.
          </p>
        </div>
        <StatusBadge status={record.status} />
      </div>
      {record.hash ? (
        <a
          href={getExplorerTxUrl(chain.id, record.hash)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all rounded border border-[#90D79F]/20 bg-[#90D79F]/10 p-3 font-mono text-xs text-[#ECE8E8] transition hover:bg-[#90D79F]/15"
        >
          {record.hash}
        </a>
      ) : null}
      {record.error ? (
        <p className="mt-3 rounded border border-red-300/20 bg-red-300/10 p-3 text-sm leading-6 text-red-100">
          {record.error}
        </p>
      ) : null}
    </div>
  );
}

export function OnchainActions({ result }: { result: BattleResult | null }) {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const [pendingTarget, setPendingTarget] = useState<RecordTarget | null>(null);
  const [chainRecords, setChainRecords] =
    useState<Record<ChainKey, ChainRecord>>(initialRecordState);
  const embeddedWallet = useMemo(
    () => wallets.find(isEmbeddedEthereumWallet),
    [wallets],
  );

  useEffect(() => {
    setPendingTarget(null);
    setChainRecords(initialRecordState);
  }, [result?.seed]);

  if (!result) {
    return null;
  }

  const megaethLoadout = loadoutToString(result.megaFighter.cards);
  const monadLoadout = loadoutToString(result.monadFighter.cards);
  const battleHash = createBattleHash({
    arenaId: result.arena.id,
    megaethLoadout,
    monadLoadout,
    winner: result.winner,
    megaethScore: result.megaScore,
    monadScore: result.monadScore,
    seed: result.seed,
  });
  const isBusy = Boolean(pendingTarget);

  const ensureWallet = async () => {
    if (!authenticated) {
      login();
      throw new Error("Login with Privy first, then record the battle.");
    }

    if (embeddedWallet) {
      return embeddedWallet;
    }

    const createdWallet = await createWallet();

    if (!isEmbeddedEthereumWallet(createdWallet)) {
      throw new Error("Privy did not return an Ethereum embedded wallet.");
    }

    return createdWallet;
  };

  const recordOnChain = async (chainKey: ChainKey) => {
    const chain = chainForKey(chainKey);
    const contractAddress = getBattleContractAddress(chain.id);

    setChainRecord(setChainRecords, chainKey, {
      status: "switching",
      hash: null,
      error: null,
    });

    if (!contractAddress) {
      throw new Error(
        chain.id === monadTestnet.id
          ? "Missing NEXT_PUBLIC_MONAD_BATTLE_CONTRACT."
          : "Missing NEXT_PUBLIC_MEGAETH_BATTLE_CONTRACT.",
      );
    }

    if (chain.id === megaethTestnet.id && !isMegaethRpcConfigured()) {
      throw new Error("Missing NEXT_PUBLIC_MEGAETH_RPC for MegaETH Testnet.");
    }

    const wallet = await ensureWallet();
    await wallet.switchChain(chain.id);
    const provider = await wallet.getEthereumProvider();
    const walletClient = createWalletClient({
      account: wallet.address as Address,
      chain: chain as Chain,
      transport: custom(provider as EIP1193Provider),
    });
    const publicClient = createPublicClient({
      chain: chain as Chain,
      transport: http(chain.rpcUrls.default.http[0]),
    });

    setChainRecord(setChainRecords, chainKey, {
      status: "waiting-signature",
    });

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: fastEVMFightersAbi,
      functionName: "recordBattle",
      args: [
        result.arena.id,
        megaethLoadout,
        monadLoadout,
        winnerToEnum(result.winner),
        BigInt(result.megaScore),
        BigInt(result.monadScore),
        battleHash,
      ],
    });

    setChainRecord(setChainRecords, chainKey, {
      status: "pending-tx",
      hash,
    });

    await publicClient.waitForTransactionReceipt({ hash });

    setChainRecord(setChainRecords, chainKey, {
      status: "success",
      hash,
      error: null,
    });
  };

  const safeRecordOnChain = async (chainKey: ChainKey) => {
    try {
      await recordOnChain(chainKey);
      return true;
    } catch (recordError) {
      setChainRecord(setChainRecords, chainKey, {
        status: "error",
        error: getReadableError(recordError),
      });
      return false;
    }
  };

  const handleRecord = async (target: RecordTarget) => {
    if (target === "both") {
      const shouldContinue = window.confirm(
        "Record both asks for two wallet approvals: MegaETH, then Monad.",
      );

      if (!shouldContinue) {
        return;
      }
    }

    setPendingTarget(target);

    try {
      if (target === "monad") {
        await safeRecordOnChain("monad");
      } else if (target === "megaeth") {
        await safeRecordOnChain("megaeth");
      } else {
        await safeRecordOnChain("megaeth");
        await safeRecordOnChain("monad");
      }
    } finally {
      setPendingTarget(null);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-white/10 bg-black/35 p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#90D79F]">
            Final records
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Record result
          </h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[34rem]">
          <button
            type="button"
            onClick={() => handleRecord("monad")}
            disabled={isBusy}
            className="rounded-lg border border-[#836EF9]/35 bg-[#836EF9]/10 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#FBFAF9] transition hover:bg-[#836EF9]/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingTarget === "monad" ? "Recording..." : "Record Monad"}
          </button>
          <button
            type="button"
            onClick={() => handleRecord("megaeth")}
            disabled={isBusy}
            className="rounded-lg border border-[#F5AF94]/35 bg-[#F5AF94]/10 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#ECE8E8] transition hover:bg-[#F5AF94]/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingTarget === "megaeth" ? "Recording..." : "Record MegaETH"}
          </button>
          <button
            type="button"
            onClick={() => handleRecord("both")}
            disabled={isBusy}
            className="rounded-lg border border-[#70BAD2]/35 bg-[#70BAD2]/10 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#ECE8E8] transition hover:bg-[#70BAD2]/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingTarget === "both" ? "Recording..." : "Record Both"}
          </button>
        </div>
      </div>

      <p className="mt-4 rounded-md border border-[#70BAD2]/20 bg-[#70BAD2]/10 p-3 text-sm leading-6 text-[#ECE8E8]">
        Two chains, two approvals. Each row is independent.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ChainStatusCard chainKey="monad" record={chainRecords.monad} />
        <ChainStatusCard chainKey="megaeth" record={chainRecords.megaeth} />
      </div>

      <div className="mt-5">
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-bold text-white">Gas</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Use official faucets. Testnet tokens have no monetary value.
          </p>
        </div>
      </div>
    </div>
  );
}
