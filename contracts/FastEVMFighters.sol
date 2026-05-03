// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FastEVMFighters {
    enum ChainSide {
        MegaETH,
        Monad,
        Draw
    }

    struct Battle {
        uint256 id;
        address player;
        string arenaId;
        string megaethLoadout;
        string monadLoadout;
        ChainSide winner;
        uint256 megaethScore;
        uint256 monadScore;
        bytes32 battleHash;
        uint256 timestamp;
    }

    uint256 public nextBattleId = 1;

    mapping(uint256 => Battle) public battles;
    mapping(address => uint256[]) private battlesByPlayer;

    event BattleRecorded(
        uint256 indexed id,
        address indexed player,
        string arenaId,
        ChainSide winner,
        uint256 megaethScore,
        uint256 monadScore,
        bytes32 battleHash
    );

    function recordBattle(
        string calldata arenaId,
        string calldata megaethLoadout,
        string calldata monadLoadout,
        ChainSide winner,
        uint256 megaethScore,
        uint256 monadScore,
        bytes32 battleHash
    ) external returns (uint256 battleId) {
        require(bytes(arenaId).length > 0, "Missing arena");
        require(bytes(megaethLoadout).length > 0, "Missing MegaETH loadout");
        require(bytes(monadLoadout).length > 0, "Missing Monad loadout");
        require(battleHash != bytes32(0), "Missing battle hash");

        battleId = nextBattleId++;

        battles[battleId] = Battle({
            id: battleId,
            player: msg.sender,
            arenaId: arenaId,
            megaethLoadout: megaethLoadout,
            monadLoadout: monadLoadout,
            winner: winner,
            megaethScore: megaethScore,
            monadScore: monadScore,
            battleHash: battleHash,
            timestamp: block.timestamp
        });

        battlesByPlayer[msg.sender].push(battleId);

        emit BattleRecorded(
            battleId,
            msg.sender,
            arenaId,
            winner,
            megaethScore,
            monadScore,
            battleHash
        );
    }

    function getPlayerBattles(address player) external view returns (uint256[] memory) {
        return battlesByPlayer[player];
    }
}
