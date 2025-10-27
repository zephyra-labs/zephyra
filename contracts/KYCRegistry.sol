// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KYCRegistry is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    enum DocumentStatus { Draft, Reviewed, Signed }

    struct Document {
        string fileHash;
        DocumentStatus status;
    }

    // Mapping tokenId -> Document
    mapping(uint256 => Document) public documents;

    // Mapping hash -> tokenId (supaya dokumen unik)
    mapping(string => uint256) public hashToTokenId;

    // Mapping untuk akun yang diperbolehkan mint (importir & eksportir)
    mapping(address => bool) public approvedMinters;

    // ---------------- Events ----------------
    event DocumentVerified(address indexed owner, uint256 tokenId, string fileHash);
    event DocumentReviewed(uint256 tokenId);
    event DocumentSigned(uint256 tokenId);
    event DocumentRevoked(uint256 tokenId);

    // ---------------- Constructor ----------------
    constructor(address initialOwner) ERC721("VerifiedDocument", "VDOC") Ownable(initialOwner) {}

    // ---------------- Minter Management ----------------
    function addMinter(address minter) external onlyOwner {
        require(!approvedMinters[minter], "Minter already approved");
        approvedMinters[minter] = true;
    }

    function removeMinter(address minter) external onlyOwner {
        require(approvedMinters[minter], "Minter not approved");
        approvedMinters[minter] = false;
    }

    modifier onlyApprovedMinter() {
        require(approvedMinters[msg.sender], "Not an approved minter");
        _;
    }

    // ---------------- Mint ----------------
    function verifyAndMint(
        address to,
        string memory fileHash,
        string memory tokenURI
    ) external onlyApprovedMinter returns (uint256) {
        require(hashToTokenId[fileHash] == 0, "Document already verified");

        nextTokenId++;
        uint256 newTokenId = nextTokenId;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        documents[newTokenId] = Document(fileHash, DocumentStatus.Draft);
        hashToTokenId[fileHash] = newTokenId;

        emit DocumentVerified(to, newTokenId, fileHash);

        return newTokenId;
    }

    // ---------------- Review ----------------
    function reviewDocument(uint256 tokenId) external onlyOwner {
        require(ERC721.ownerOf(tokenId) != address(0), "Token does not exist");
        require(documents[tokenId].status == DocumentStatus.Draft, "Only Draft can be reviewed");

        documents[tokenId].status = DocumentStatus.Reviewed;
        emit DocumentReviewed(tokenId);
    }

    // ---------------- Sign ----------------
    function signDocument(uint256 tokenId) external onlyOwner {
        require(ERC721.ownerOf(tokenId) != address(0), "Token does not exist");
        require(documents[tokenId].status == DocumentStatus.Reviewed, "Only Reviewed can be signed");

        documents[tokenId].status = DocumentStatus.Signed;
        emit DocumentSigned(tokenId);
    }

    // ---------------- Revoke ----------------
    function revokeDocument(uint256 tokenId) external onlyOwner {
        require(ERC721.ownerOf(tokenId) != address(0), "Token does not exist");
        require(documents[tokenId].status != DocumentStatus.Signed, "Signed docs cannot be revoked");

        string memory fileHash = documents[tokenId].fileHash;
        delete hashToTokenId[fileHash];
        delete documents[tokenId];

        _burn(tokenId);
        emit DocumentRevoked(tokenId);
    }

    // ---------------- View Helpers ----------------
    function getTokenIdByHash(string memory fileHash) external view returns (uint256) {
        return hashToTokenId[fileHash];
    }

    function getStatus(uint256 tokenId) external view returns (DocumentStatus) {
        require(ERC721.ownerOf(tokenId) != address(0), "Token does not exist");
        return documents[tokenId].status;
    }

    function isMinter(address addr) external view returns (bool) {
        return approvedMinters[addr];
    }
}
