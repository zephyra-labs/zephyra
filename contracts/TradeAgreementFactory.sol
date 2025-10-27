// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TradeAgreement.sol";
import "./KYCRegistry.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TradeAgreementFactory is AccessControl {
    address[] public deployedContracts;
    address public registry;

    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;

    event ContractDeployed(
        address indexed contractAddress,
        address importer,
        uint256 importerDocId,
        address exporter,
        uint256 exporterDocId,
        address logistics,
        uint256 logisticsDocId,
        uint256 requiredAmount,
        address token
    );

    constructor(address _registry) {
        require(_registry != address(0), "Registry zero");
        registry = _registry;
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function deployTradeAgreement(
        address _importer,
        address _exporter,
        address _logistics,
        uint256 _requiredAmount,
        uint256 _importerDocId,
        uint256 _exporterDocId,
        uint256 _logisticsDocId,
        address _token
    ) external onlyRole(ADMIN_ROLE) returns (address) {
        require(_importer != address(0) && _exporter != address(0) && _logistics != address(0), "Party zero");

        // --- Load KYC Registry ---
        KYCRegistry reg = KYCRegistry(registry);

        // --- Validate importer doc ---
        require(reg.ownerOf(_importerDocId) == _importer, "Importer doc not owned");
        require(reg.getStatus(_importerDocId) == KYCRegistry.DocumentStatus.Signed, "Importer doc not signed");

        // --- Validate exporter doc ---
        require(reg.ownerOf(_exporterDocId) == _exporter, "Exporter doc not owned");
        require(reg.getStatus(_exporterDocId) == KYCRegistry.DocumentStatus.Signed, "Exporter doc not signed");

        // --- Validate logistics doc ---
        require(reg.ownerOf(_logisticsDocId) == _logistics, "Logistics doc not owned");
        require(reg.getStatus(_logisticsDocId) == KYCRegistry.DocumentStatus.Signed, "Logistics doc not signed");

        // --- Deploy TradeAgreement with factory admin as admin ---
        TradeAgreement newContract = new TradeAgreement(
            msg.sender,
            _importer,
            _exporter,
            _logistics,
            _requiredAmount,
            registry,
            _importerDocId,
            _exporterDocId,
            _logisticsDocId,
            _token
        );

        deployedContracts.push(address(newContract));

        emit ContractDeployed(
            address(newContract),
            _importer,
            _importerDocId,
            _exporter,
            _exporterDocId,
            _logistics,
            _logisticsDocId,
            _requiredAmount,
            _token
        );

        return address(newContract);
    }

    function getDeployedContracts() external view returns (address[] memory) {
        return deployedContracts;
    }
}
