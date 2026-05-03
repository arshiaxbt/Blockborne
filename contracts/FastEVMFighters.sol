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

    struct ActionRecord {
        bytes32 battleSessionId;
        address player;
        string fighter;
        string actionName;
        string actionType;
        uint256 round;
        uint256 damage;
        bytes32 actionHash;
        uint256 timestamp;
    }

    uint256 public nextBattleId = 1;
    uint256 public nextActionId = 1;

    mapping(uint256 => Battle) public battles;
    mapping(uint256 => ActionRecord) public actions;
    mapping(address => uint256[]) private battlesByPlayer;
    mapping(bytes32 => uint256[]) private actionIdsBySession;

    event BattleRecorded(
        uint256 indexed id,
        address indexed player,
        string arenaId,
        ChainSide winner,
        uint256 megaethScore,
        uint256 monadScore,
        bytes32 battleHash
    );

    event ActionRecorded(
        bytes32 indexed battleSessionId,
        address indexed player,
        string fighter,
        string actionName,
        string actionType,
        uint256 round,
        uint256 damage,
        bytes32 actionHash
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

    function recordAction(
        bytes32 battleSessionId,
        string calldata fighter,
        string calldata actionName,
        string calldata actionType,
        uint256 round,
        uint256 damage,
        bytes32 actionHash
    ) external returns (uint256 actionId) {
        require(battleSessionId != bytes32(0), "Missing battle session");
        require(bytes(fighter).length > 0, "Missing fighter");
        require(bytes(actionName).length > 0, "Missing action");
        require(round > 0, "Missing round");
        require(actionHash != bytes32(0), "Missing action hash");

        actionId = nextActionId++;

        actions[actionId] = ActionRecord({
            battleSessionId: battleSessionId,
            player: msg.sender,
            fighter: fighter,
            actionName: actionName,
            actionType: actionType,
            round: round,
            damage: damage,
            actionHash: actionHash,
            timestamp: block.timestamp
        });

        actionIdsBySession[battleSessionId].push(actionId);

        emit ActionRecorded(
            battleSessionId,
            msg.sender,
            fighter,
            actionName,
            actionType,
            round,
            damage,
            actionHash
        );
    }

    function getSessionActions(bytes32 battleSessionId) external view returns (uint256[] memory) {
        return actionIdsBySession[battleSessionId];
    }
}
