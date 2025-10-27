// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DocumentRegistry is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    // --- Types ---
    enum DocumentStatus { Draft, Reviewed, Signed }

    // --- Storage ---
    mapping(string => uint256) public hashToTokenId;
    mapping(uint256 => string) public tokenIdToDocType;
    mapping(address => bool) public approvedMinters;
    mapping(uint256 => DocumentStatus) public documentStatus;

    // --- Events ---
    event DocumentVerified(address indexed owner, uint256 tokenId, string fileHash);
    event DocumentLinked(address indexed contractAddress, uint256 indexed tokenId, string docType, string uri);
    event DocumentRevoked(uint256 tokenId);
    event DocumentStatusChanged(uint256 indexed tokenId, DocumentStatus newStatus);

    constructor(address initialOwner) ERC721("TradeDocument", "TDOC") Ownable(initialOwner) {}

    modifier onlyApprovedMinter() {
        require(approvedMinters[msg.sender], "Not an approved minter");
        _;
    }

    // --- Minter Management ---
    function addMinter(address minter) external onlyOwner {
        require(!approvedMinters[minter], "Minter already approved");
        approvedMinters[minter] = true;
    }
    
    function removeMinter(address minter) external onlyOwner {
        require(approvedMinters[minter], "Minter not approved");
        approvedMinters[minter] = false;
    }

    function isMinter(address addr) external view returns (bool) {
        return approvedMinters[addr];
    }

    // --- Document Lifecycle ---
    function verifyAndMint(
        address to,
        string memory fileHash,
        string memory docTokenURI,
        string memory docType
    ) external onlyApprovedMinter returns (uint256) {
        require(hashToTokenId[fileHash] == 0, "Document already verified");

        nextTokenId++;
        uint256 newTokenId = nextTokenId;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, docTokenURI);

        tokenIdToDocType[newTokenId] = docType;
        hashToTokenId[fileHash] = newTokenId;

        // Default status = Draft
        documentStatus[newTokenId] = DocumentStatus.Draft;

        emit DocumentVerified(to, newTokenId, fileHash);
        return newTokenId;
    }

    function reviewDocument(uint256 tokenId) external onlyApprovedMinter {
        require(ERC721.ownerOf(tokenId) != address(0), "Token does not exist");
        require(documentStatus[tokenId] == DocumentStatus.Draft, "Must be Draft");
        documentStatus[tokenId] = DocumentStatus.Reviewed;
        emit DocumentStatusChanged(tokenId, DocumentStatus.Reviewed);
    }

    function signDocument(uint256 tokenId) external onlyApprovedMinter {
        require(ERC721.ownerOf(tokenId) != address(0), "Token does not exist");
        require(documentStatus[tokenId] == DocumentStatus.Reviewed, "Must be Reviewed first");
        documentStatus[tokenId] = DocumentStatus.Signed;
        emit DocumentStatusChanged(tokenId, DocumentStatus.Signed);
    }

    // --- Linking ---
    function linkDocumentToContract(address contractAddress, uint256 tokenId) external onlyApprovedMinter {
        require(ERC721.ownerOf(tokenId) != address(0), "Token does not exist");
        emit DocumentLinked(contractAddress, tokenId, tokenIdToDocType[tokenId], tokenURI(tokenId));
    }

    // --- Revocation ---
    function revokeDocument(uint256 tokenId) external onlyOwner {
        require(ERC721.ownerOf(tokenId) != address(0), "Token does not exist");
        require(documentStatus[tokenId] != DocumentStatus.Signed, "Signed docs cannot be revoked");
        _burn(tokenId);
        emit DocumentRevoked(tokenId);
    }

    // --- Getters ---
    function getTokenIdByHash(string memory fileHash) external view returns (uint256) {
        return hashToTokenId[fileHash];
    }

    function getDocType(uint256 tokenId) external view returns (string memory) {
        return tokenIdToDocType[tokenId];
    }

    function getStatus(uint256 tokenId) external view returns (DocumentStatus) {
        require(ERC721.ownerOf(tokenId) != address(0), "Token does not exist");
        return documentStatus[tokenId];
    }
}
