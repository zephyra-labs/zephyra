// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IDocumentRegistry {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract TradeAgreement is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---------------- Roles ----------------
    bytes32 public constant IMPORTER_ROLE = keccak256("IMPORTER_ROLE");
    bytes32 public constant EXPORTER_ROLE = keccak256("EXPORTER_ROLE");
    bytes32 public constant LOGISTICS_ROLE = keccak256("LOGISTICS_ROLE");
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;

    // ---------------- Stages ----------------
    enum Stage {
        Draft,
        SignedByImporter,
        SignedByExporter,
        SignedByBoth,
        Deposited,
        ShippingInitiated,
        InTransit,
        ArrivedPort,
        CustomsCleared,
        Delivered,
        Completed,
        Cancelled
    }

    // ---------------- State ----------------
    IDocumentRegistry public registry;
    address public importer;
    address public exporter;
    address public logistics;
    uint256 public importerDocId;
    uint256 public exporterDocId;
    uint256 public logisticsDocId;
    uint256 public requiredAmount;
    uint256 public totalDeposited;
    address public token; // address(0) == ETH

    bool public importerSigned;
    bool public exporterSigned;
    Stage public currentStage;

    // ---------------- Events ----------------
    event Deposit(address indexed from, uint256 amount, uint256 totalDeposited);
    event Signed(address indexed by, Stage resultingStage);
    event Released(address indexed to, uint256 amount);
    event Refunded(address indexed to, uint256 amount);
    event StageChanged(Stage oldStage, Stage newStage, address by, uint256 timestamp);
    event Cancelled(address by, string reason);
    event ShippingStatusUpdated(Stage stage, string details, address by, uint256 timestamp);

    // ---------------- Modifiers ----------------
    modifier onlyParty() {
        require(hasRole(IMPORTER_ROLE, msg.sender) || hasRole(EXPORTER_ROLE, msg.sender), "Not a party");
        _;
    }

    modifier onlyImporter() {
        require(hasRole(IMPORTER_ROLE, msg.sender), "Only importer");
        _;
    }

    modifier onlyExporter() {
        require(hasRole(EXPORTER_ROLE, msg.sender), "Only exporter");
        _;
    }

    modifier onlyLogistics() {
        require(hasRole(LOGISTICS_ROLE, msg.sender), "Only logistics");
        _;
    }

    modifier atStage(Stage s) {
        require(currentStage == s, "Invalid stage");
        _;
    }

    // ---------------- Constructor ----------------
    constructor(
        address _admin,
        address _importer,
        address _exporter,
        address _logistics,
        uint256 _requiredAmount,
        address _registry,
        uint256 _importerDocId,
        uint256 _exporterDocId,
        uint256 _logisticsDocId,
        address _token
    ) {
        require(_admin != address(0), "admin zero");
        require(_importer != address(0) && _exporter != address(0) && _logistics != address(0), "party zero");
        require(_registry != address(0), "registry zero");
        require(_requiredAmount > 0, "requiredAmount zero");

        // assign roles
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(IMPORTER_ROLE, _importer);
        _grantRole(EXPORTER_ROLE, _exporter);
        _grantRole(LOGISTICS_ROLE, _logistics);

        importer = _importer;
        exporter = _exporter;
        logistics = _logistics;
        registry = IDocumentRegistry(_registry);

        // verify document ownership
        require(registry.ownerOf(_importerDocId) == _importer, "Importer doc invalid");
        require(registry.ownerOf(_exporterDocId) == _exporter, "Exporter doc invalid");
        require(registry.ownerOf(_logisticsDocId) == _logistics, "Logistics doc invalid");

        importerDocId = _importerDocId;
        exporterDocId = _exporterDocId;
        logisticsDocId = _logisticsDocId;
        requiredAmount = _requiredAmount;
        token = _token;

        currentStage = Stage.Draft;
    }

    // ---------------- Signing ----------------
    function sign() external onlyParty {
        require(
            currentStage == Stage.Draft ||
            currentStage == Stage.SignedByImporter ||
            currentStage == Stage.SignedByExporter,
            "Signing closed"
        );

        if (hasRole(IMPORTER_ROLE, msg.sender)) {
            require(!importerSigned, "Importer already signed");
            importerSigned = true;
        } else if (hasRole(EXPORTER_ROLE, msg.sender)) {
            require(!exporterSigned, "Exporter already signed");
            exporterSigned = true;
        } else {
            revert("Unknown signer");
        }

        if (importerSigned && exporterSigned) {
            _setStage(Stage.SignedByBoth);
        } else if (importerSigned) {
            _setStage(Stage.SignedByImporter);
        } else {
            _setStage(Stage.SignedByExporter);
        }

        emit Signed(msg.sender, currentStage);
    }

    // ---------------- Deposit (partial allowed) ----------------
    function deposit(uint256 _amount) external payable nonReentrant onlyImporter atStage(Stage.SignedByBoth) {
        require(_amount > 0, "amount zero");

        if (token == address(0)) {
            require(msg.value == _amount, "Incorrect ETH amount");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        totalDeposited += _amount;
        emit Deposit(msg.sender, _amount, totalDeposited);

        if (totalDeposited >= requiredAmount) {
            _setStage(Stage.Deposited);
        }
    }

    // ---------------- Shipping Multi-Phase ----------------
    // Exporter starts shipping once funds deposited
    function startShipping(string calldata details) external onlyExporter atStage(Stage.Deposited) {
        _setStage(Stage.ShippingInitiated);
        emit ShippingStatusUpdated(Stage.ShippingInitiated, details, msg.sender, block.timestamp);
    }

    // Logistics marks in transit
    function markInTransit(string calldata details) external onlyLogistics atStage(Stage.ShippingInitiated) {
        _setStage(Stage.InTransit);
        emit ShippingStatusUpdated(Stage.InTransit, details, msg.sender, block.timestamp);
    }

    // Logistics confirms arrival at destination port
    function confirmArrival(string calldata details) external onlyLogistics atStage(Stage.InTransit) {
        _setStage(Stage.ArrivedPort);
        emit ShippingStatusUpdated(Stage.ArrivedPort, details, msg.sender, block.timestamp);
    }

    // Importer confirms customs cleared (or importer can call once docs ok)
    function customsClearance(string calldata details) external onlyImporter atStage(Stage.ArrivedPort) {
        _setStage(Stage.CustomsCleared);
        emit ShippingStatusUpdated(Stage.CustomsCleared, details, msg.sender, block.timestamp);
    }

    // Importer confirms delivery to final recipient
    function confirmDelivery(string calldata details) external onlyImporter atStage(Stage.CustomsCleared) {
        _setStage(Stage.Delivered);
        emit ShippingStatusUpdated(Stage.Delivered, details, msg.sender, block.timestamp);
    }

    // ---------------- Complete ----------------
    // Complete only after Delivered
    function complete() external onlyImporter atStage(Stage.Delivered) nonReentrant {
        require(totalDeposited >= requiredAmount, "Insufficient funds");
        _setStage(Stage.Completed);

        uint256 exporterAmount = requiredAmount;
        uint256 excess = totalDeposited - requiredAmount;

        // Zero out deposited balance **before external calls**
        totalDeposited = 0;

        // Transfer funds (pull-over-push pattern)
        _safeTransferOut(exporter, exporterAmount);
        emit Released(exporter, exporterAmount);

        if (excess > 0) {
            _safeTransferOut(importer, excess);
            emit Refunded(importer, excess);
        }
    }

    // ---------------- Cancel / Refund ----------------
    function cancel(string calldata reason) external onlyParty nonReentrant {
        require(currentStage != Stage.Completed && currentStage != Stage.Cancelled, "Cannot cancel");
        _setStage(Stage.Cancelled);
        emit Cancelled(msg.sender, reason);
    
        uint256 refundAmount = totalDeposited;
        totalDeposited = 0; // zero out first
        if (refundAmount > 0) {
            _safeTransferOut(importer, refundAmount);
            emit Refunded(importer, refundAmount);
        }
    }
    
    // ---------------- Admin Utilities ----------------
    function updateRequiredAmount(uint256 _newAmount) external onlyRole(ADMIN_ROLE) {
        require(currentStage <= Stage.SignedByBoth, "Cannot update now");
        require(_newAmount > 0, "zero");
        requiredAmount = _newAmount;
    }

    function grantImporter(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(IMPORTER_ROLE, account);
        importer = account;
    }

    function grantExporter(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(EXPORTER_ROLE, account);
        exporter = account;
    }

    function grantLogistics(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(LOGISTICS_ROLE, account);
        logistics = account;
    }

    // Optionally allow admin to revoke/replace logistics address
    function revokeLogistics(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(LOGISTICS_ROLE, account);
        // if the account was the stored logistics, clear
        if (logistics == account) {
            logistics = address(0);
        }
    }

    // ---------------- View ----------------
    function balance() external view returns (uint256) {
        return token == address(0) ? address(this).balance : IERC20(token).balanceOf(address(this));
    }

    // ---------------- Internal ----------------
    function _setStage(Stage newStage) internal {
        Stage old = currentStage;
        currentStage = newStage;
        emit StageChanged(old, newStage, msg.sender, block.timestamp);
    }

    function _safeTransferOut(address to, uint256 amount) internal {
        if (amount == 0) return;

        if (token == address(0)) {
            // Use call to forward gas and handle revert safely
            (bool sent, ) = payable(to).call{value: amount}("");
            require(sent, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // ---------------- Fallback for ETH ----------------
    receive() external payable {}
}
