// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    mapping(address => uint256[]) private userTransactions; // Mapping to store user transaction history


    constructor() ERC721("MyNFT", "NFT") {}

    function mintNFT(address recipient, string memory tokenURI)
        public
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        userTransactions[recipient].push(newItemId);
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
         // Record user transaction

        return newItemId;
    }

    modifier onlyOwnerOf(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can update the token URI");
        _;
    }


   function updateTokenURI(uint256 tokenId, string memory newTokenURI)
        public
        onlyOwnerOf(tokenId)
    {
        require(_exists(tokenId), "Token ID does not exist");
        _setTokenURI(tokenId, newTokenURI);
    }


    function getUserTransactionHistory(address user)
        public
        view
        returns (uint256[] memory)
    {
        return userTransactions[user];
    }

}
