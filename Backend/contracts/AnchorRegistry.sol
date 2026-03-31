// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AnchorRegistry
 * @notice Append-only registry that stores SHA-256 fingerprints of AtmosTrack sensor readings.
 *         Once a reading is anchored its hash is permanently on-chain and cannot be changed.
 */
contract AnchorRegistry {
    // ─── Events ────────────────────────────────────────────────────────────────
    event Anchored(
        bytes32 indexed readingId,
        bytes32 dataHash,
        uint256 anchoredAt
    );

    // ─── State ─────────────────────────────────────────────────────────────────
    mapping(bytes32 => bytes32)   public anchors;      // readingId → dataHash
    mapping(bytes32 => uint256)   public anchoredAt;   // readingId → block.timestamp
    mapping(bytes32 => bool)      public exists;       // readingId → anchored?

    // ─── Write ─────────────────────────────────────────────────────────────────
    /**
     * @notice Anchor a sensor-reading hash on-chain (one-time, immutable).
     * @param readingId  keccak256 / bytes32 form of the MongoDB ObjectId string
     * @param dataHash   SHA-256 fingerprint of the sensor payload (as bytes32)
     */
    function anchor(bytes32 readingId, bytes32 dataHash) external {
        require(!exists[readingId], "AnchorRegistry: already anchored");
        anchors[readingId]    = dataHash;
        anchoredAt[readingId] = block.timestamp;
        exists[readingId]     = true;
        emit Anchored(readingId, dataHash, block.timestamp);
    }

    // ─── Read ──────────────────────────────────────────────────────────────────
    /**
     * @notice Retrieve the on-chain record for a reading.
     * @return dataHash   The stored SHA-256 hash (zero if not anchored)
     * @return timestamp  Block timestamp when it was anchored (0 if not anchored)
     * @return isAnchored Whether this reading has been anchored
     */
    function verify(bytes32 readingId)
        external
        view
        returns (bytes32 dataHash, uint256 timestamp, bool isAnchored)
    {
        return (anchors[readingId], anchoredAt[readingId], exists[readingId]);
    }
}
