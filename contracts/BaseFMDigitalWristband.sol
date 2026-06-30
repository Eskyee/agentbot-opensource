// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BaseFMDigitalWristband
 * @notice ERC-721 NFT for baseFM event access and digital identity
 * @dev Deployed on Base Mainnet (Chain ID: 8453)
 *
 * Features:
 * - Gasless minting via CDP Paymaster (gaslessMint)
 * - Paid minting with ETH (mintWristband)
 * - Configurable mint price
 * - Max supply cap
 * - Owner withdrawal
 * - ERC-721 URI storage for metadata
 *
 * Constructor args:
 *   name:     "baseFM Digital Wristband"
 *   symbol:   "bfmw"
 *   baseURI:  "https://agentbot.sh/api/wristband/metadata/"
 *   initialOwner: deployer address
 */
contract BaseFMDigitalWristband is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 10_000;
    uint256 public mintPrice = 0.001 ether;

    string private _baseTokenURI;

    // Allowlist for gasless mints. A signature/Paymaster only sponsors gas; it
    // does NOT authorize who may mint. Without this, gaslessMint was a public,
    // free, unlimited mint that bypassed mintPrice and could exhaust supply /
    // drain the Paymaster. Only owner-allowlisted recipients may claim, once.
    mapping(address => bool) public gaslessAllowed;
    mapping(address => bool) public gaslessClaimed;

    // Events
    event WristbandMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event BaseURIUpdated(string newBaseURI);
    event MintPriceUpdated(uint256 newPrice);
    event Withdrawn(address indexed to, uint256 amount);
    event GaslessAllowlistUpdated(address indexed account, bool allowed);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        _baseTokenURI = baseURI_;
    }

    /**
     * @notice Mint a wristband NFT with ETH payment
     * @param to Recipient address
     * @param tokenURI Metadata URI for the token
     * @return tokenId The minted token ID
     */
    function mintWristband(
        address to,
        string calldata tokenURI
    ) external payable nonReentrant returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        if (bytes(tokenURI).length > 0) {
            _setTokenURI(tokenId, tokenURI);
        }

        emit WristbandMinted(to, tokenId, tokenURI);
        return tokenId;
    }

    /**
     * @notice Gasless mint for allowlisted addresses (sponsored by CDP Paymaster)
     * @dev No ETH payment required — gas is sponsored by the Paymaster. Gating
     *      is enforced ON-CHAIN: `to` must be on the owner-managed allowlist and
     *      may only claim once. The Paymaster sponsoring gas is NOT authorization.
     * @param to Recipient address (must be allowlisted)
     * @param tokenURI Metadata URI for the token
     * @return tokenId The minted token ID
     */
    function gaslessMint(
        address to,
        string calldata tokenURI
    ) external nonReentrant returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(gaslessAllowed[to], "Not allowlisted for gasless mint");
        require(!gaslessClaimed[to], "Gasless wristband already claimed");
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");

        // Mark claimed before minting (checks-effects-interactions; _safeMint
        // can call back into an ERC721Receiver).
        gaslessClaimed[to] = true;

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        if (bytes(tokenURI).length > 0) {
            _setTokenURI(tokenId, tokenURI);
        }

        emit WristbandMinted(to, tokenId, tokenURI);
        return tokenId;
    }

    /**
     * @notice Add or remove an address from the gasless-mint allowlist
     * @param account Address to update
     * @param allowed True to allow a (one-time) gasless mint, false to revoke
     */
    function setGaslessAllowed(address account, bool allowed) external onlyOwner {
        require(account != address(0), "Invalid account");
        gaslessAllowed[account] = allowed;
        emit GaslessAllowlistUpdated(account, allowed);
    }

    /**
     * @notice Batch update the gasless-mint allowlist
     * @param accounts Addresses to update
     * @param allowed True to allow, false to revoke (applied to all accounts)
     */
    function setGaslessAllowedBatch(address[] calldata accounts, bool allowed) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "Invalid account");
            gaslessAllowed[accounts[i]] = allowed;
            emit GaslessAllowlistUpdated(accounts[i], allowed);
        }
    }

    /**
     * @notice Batch mint wristbands (owner only)
     * @param recipients Array of recipient addresses
     * @param tokenURIs Array of metadata URIs
     */
    function batchMint(
        address[] calldata recipients,
        string[] calldata tokenURIs
    ) external onlyOwner nonReentrant returns (uint256[] memory) {
        require(recipients.length == tokenURIs.length, "Length mismatch");
        require(_nextTokenId + recipients.length <= MAX_SUPPLY, "Exceeds max supply");

        uint256[] memory tokenIds = new uint256[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(recipients[i], tokenId);
            if (bytes(tokenURIs[i]).length > 0) {
                _setTokenURI(tokenId, tokenURIs[i]);
            }
            tokenIds[i] = tokenId;
            emit WristbandMinted(recipients[i], tokenId, tokenURIs[i]);
        }
        return tokenIds;
    }

    /**
     * @notice Update the base URI for token metadata
     * @param newBaseURI The new base URI
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Update the mint price
     * @param newPrice The new mint price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    /**
     * @notice Withdraw contract balance to owner
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
        emit Withdrawn(owner(), balance);
    }

    /**
     * @notice View total minted tokens
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice View remaining supply
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _nextTokenId;
    }

    // Required overrides
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
