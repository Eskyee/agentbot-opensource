// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Wristband is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public constant MINT_PRICE = 0.001 ether;
    uint256 public constant MAX_SUPPLY = 10000;
    
    mapping(address => uint256) public mintedBy;
    
    event WristbandMinted(address indexed to, uint256 tokenId);

    constructor() ERC721("Digital Wristband", "WRISTBAND") Ownable(msg.sender) {}

    function mint() external payable returns (uint256) {
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _generateURI(tokenId));
        
        mintedBy[msg.sender] = tokenId;
        emit WristbandMinted(msg.sender, tokenId);
        
        return tokenId;
    }

    function mintTo(address to) external onlyOwner returns (uint256) {
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, _generateURI(tokenId));
        
        mintedBy[to] = tokenId;
        emit WristbandMinted(to, tokenId);
        
        return tokenId;
    }

    function hasWristband(address user) external view returns (bool) {
        return mintedBy[user] > 0 || balanceOf(user) > 0;
    }

    function getTokenId(address user) external view returns (uint256) {
        return mintedBy[user];
    }

    function _generateURI(uint256 tokenId) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "https://agentbot.raveculture.xyz/api/wristband/metadata/",
            Strings.toString(tokenId)
        ));
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function withdraw() external onlyOwner {
        payable(owner()).call{value: address(this).balance}("");
    }
}
