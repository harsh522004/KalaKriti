// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    uint256 public constant MARKETPLACE_FEE_BPS = 200;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    address public feeRecipient;
    uint256 public listingCounter;

    struct Listing {
        address seller;
        address collection;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(address => mapping(uint256 => bool)) public nftIsListed;

    event NFTListed(uint256 indexed listingId, address indexed seller, address indexed collection, uint256 tokenId, uint256 price);
    event NFTSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 tokenId, uint256 price);
    event ListingCancelled(uint256 indexed listingId);

    error NotOwner();
    error NotSeller();
    error PriceZero();
    error AlreadyListed();
    error NotListed();
    error WrongPrice();
    error NoFunds();
    error TransferFailed();
    error NotApproved();
    error SelfPurchase();

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    function listNFT(address collection, uint256 tokenId, uint256 price) external returns (uint256) {}
    function cancelListing(uint256 listingId) external {}
    function buyNFT(uint256 listingId) external payable nonReentrant {}
    function withdrawFunds() external nonReentrant {}
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
}
