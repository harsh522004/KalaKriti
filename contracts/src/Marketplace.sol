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

    function listNFT(address collection, uint256 tokenId, uint256 price) external returns (uint256) {
        if (IERC721(collection).ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (price == 0) revert PriceZero();
        if (nftIsListed[collection][tokenId]) revert AlreadyListed();

        bool approvedSingle = IERC721(collection).getApproved(tokenId) == address(this);
        bool approvedForAll = IERC721(collection).isApprovedForAll(msg.sender, address(this));
        if (!approvedSingle && !approvedForAll) revert NotApproved();

        uint256 listingId = listingCounter++;
        listings[listingId] = Listing({
            seller: msg.sender,
            collection: collection,
            tokenId: tokenId,
            price: price,
            active: true
        });
        nftIsListed[collection][tokenId] = true;

        emit NFTListed(listingId, msg.sender, collection, tokenId, price);
        return listingId;
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert NotListed();
        if (listing.seller != msg.sender) revert NotSeller();

        listing.active = false;
        nftIsListed[listing.collection][listing.tokenId] = false;

        emit ListingCancelled(listingId);
    }

    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];

        // Checks
        if (!listing.active) revert NotListed();
        if (msg.value != listing.price) revert WrongPrice();
        if (listing.seller == msg.sender) revert SelfPurchase();

        address collection = listing.collection;
        uint256 tokenId    = listing.tokenId;
        address seller     = listing.seller;
        uint256 price      = listing.price;

        if (IERC721(collection).ownerOf(tokenId) != seller) revert NotOwner();

        bool approvedSingle = IERC721(collection).getApproved(tokenId) == address(this);
        bool approvedForAll = IERC721(collection).isApprovedForAll(seller, address(this));
        if (!approvedSingle && !approvedForAll) revert NotApproved();

        // Effects
        listing.active = false;
        nftIsListed[collection][tokenId] = false;

        uint256 royaltyAmount  = 0;
        address royaltyReceiver = address(0);
        try IERC2981(collection).royaltyInfo(tokenId, price) returns (address r, uint256 a) {
            royaltyReceiver = r;
            royaltyAmount   = a;
        } catch {}

        uint256 fee          = (price * MARKETPLACE_FEE_BPS) / BPS_DENOMINATOR;
        uint256 sellerAmount = price - fee - royaltyAmount;

        pendingWithdrawals[feeRecipient] += fee;
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            pendingWithdrawals[royaltyReceiver] += royaltyAmount;
        } else {
            sellerAmount += royaltyAmount;
        }
        pendingWithdrawals[seller] += sellerAmount;

        // Interactions
        IERC721(collection).safeTransferFrom(seller, msg.sender, tokenId);

        emit NFTSold(listingId, msg.sender, seller, tokenId, price);
    }

    function withdrawFunds() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NoFunds();

        pendingWithdrawals[msg.sender] = 0;

        (bool success,) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
}
