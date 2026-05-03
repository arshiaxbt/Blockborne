import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error(
      "No deployer signer found. Set DEPLOYER_PRIVATE_KEY in your shell or .env.local.",
    );
  }

  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);

  const FastEVMFighters = await ethers.getContractFactory("FastEVMFighters");
  const fastEVMFighters = await FastEVMFighters.deploy();

  await fastEVMFighters.waitForDeployment();

  console.log("FastEVMFighters:", await fastEVMFighters.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
