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
  "pending-tx": "Pending tx",
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
      ? "border-lime-300/35 bg-lime-300/10 text-lime-50"
      : status === "error"
        ? "border-red-300/35 bg-red-300/10 text-red-100"
        : status === "idle"
          ? "border-white/10 bg-white/[0.04] text-slate-300"
          : "border-cyan-300/35 bg-cyan-300/10 text-cyan-50";

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
      ? "border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-100"
      : "border-orange-300/25 bg-orange-300/10 text-orange-100";

  return (
    <div className={`rounded-md border p-4 ${accent}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em]">
            {chain.name}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Optional record of this one simulated result.
          </p>
        </div>
        <StatusBadge status={record.status} />
      </div>
      {record.hash ? (
        <a
          href={getExplorerTxUrl(chain.id, record.hash)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block break-all rounded border border-lime-300/20 bg-lime-300/10 p-3 font-mono text-xs text-lime-50 transition hover:bg-lime-300/15"
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
        "Record on Both will ask you to approve two separate testnet transactions: one on Monad Testnet and one on MegaETH Testnet.",
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
        const monadRecorded = await safeRecordOnChain("monad");

        if (monadRecorded) {
          await safeRecordOnChain("megaeth");
        }
      }
    } finally {
      setPendingTarget(null);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-white/10 bg-black/35 p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-lime-200">
            Optional onchain recording
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Record this simulated result
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            This stores the result of this specific simulated battle. It does
            not prove one chain is globally better. Privy uses an embedded app
            wallet, so MetaMask is not required.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[34rem]">
          <button
            type="button"
            onClick={() => handleRecord("monad")}
            disabled={isBusy}
            className="rounded-lg border border-fuchsia-300/35 bg-fuchsia-300/10 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-fuchsia-50 transition hover:bg-fuchsia-300/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingTarget === "monad" ? "Recording..." : "Record on Monad"}
          </button>
          <button
            type="button"
            onClick={() => handleRecord("megaeth")}
            disabled={isBusy}
            className="rounded-lg border border-orange-300/35 bg-orange-300/10 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-orange-50 transition hover:bg-orange-300/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingTarget === "megaeth" ? "Recording..." : "Record on MegaETH"}
          </button>
          <button
            type="button"
            onClick={() => handleRecord("both")}
            disabled={isBusy}
            className="rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-cyan-50 transition hover:bg-cyan-300/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingTarget === "both" ? "Recording..." : "Record on Both"}
          </button>
        </div>
      </div>

      <p className="mt-4 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-50">
        Record on Both will ask for two signatures: one transaction for Monad
        Testnet and one transaction for MegaETH Testnet.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ChainStatusCard chainKey="monad" record={chainRecords.monad} />
        <ChainStatusCard chainKey="megaeth" record={chainRecords.megaeth} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-bold text-white">Testnet funds</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Get Monad testnet MON from the official Monad faucet. Get MegaETH
            testnet ETH from the official MegaETH faucet. Testnet tokens have no
            monetary value.
          </p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-bold text-white">Environment status</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
            <li>
              Monad contract:{" "}
              {process.env.NEXT_PUBLIC_MONAD_BATTLE_CONTRACT ? "set" : "missing"}
            </li>
            <li>
              MegaETH contract:{" "}
              {process.env.NEXT_PUBLIC_MEGAETH_BATTLE_CONTRACT
                ? "set"
                : "missing"}
            </li>
            <li>MegaETH RPC: {isMegaethRpcConfigured() ? "set" : "missing"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
