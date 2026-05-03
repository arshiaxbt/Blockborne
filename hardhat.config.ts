import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";

dotenv.config({ path: ".env.local" });
dotenv.config();

function getAccounts() {
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();

  if (!deployerPrivateKey) {
    return [];
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(deployerPrivateKey)) {
    throw new Error(
      "DEPLOYER_PRIVATE_KEY must be a 32-byte hex private key with 0x prefix.",
    );
  }

  return [deployerPrivateKey];
}

const accounts = getAccounts();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    monadTestnet: {
      url: process.env.MONAD_TESTNET_RPC ?? "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts,
    },
    megaethTestnet: {
      url: process.env.MEGAETH_TESTNET_RPC ?? "",
      chainId: 6343,
      accounts,
    },
  },
};

export default config;
