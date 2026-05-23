# Foundation & Smart Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Foundry project, implement and fully test three smart contracts (NFTCollection, CollectionFactory, Marketplace), then deploy to Sepolia with Etherscan verification.

**Architecture:** Contracts-first, TDD. Each contract gets a stub → failing tests → implementation → passing tests → commit cycle. CollectionFactory deploys NFTCollection instances. Marketplace is approval-based with pull payments and ERC-2981 royalty support.

**Tech Stack:** Foundry, Solidity ^0.8.20, OpenZeppelin v5, forge-std

---

## File Map

```
contracts/
  src/
    NFTCollection.sol        ← ERC721URIStorage + ERC2981 + Ownable
    CollectionFactory.sol    ← deploys NFTCollection instances
    Marketplace.sol          ← list/buy/cancel/withdraw + 2% fee
  test/
    NFTCollection.t.sol
    CollectionFactory.t.sol
    Marketplace.t.sol
    Integration.t.sol        ← full end-to-end flow
  script/
    DeployAll.s.sol
shared/
  addresses.json             ← populated after deploy
  abis/
    NFTCollection.json
    CollectionFactory.json
    Marketplace.json
foundry.toml                 ← updated to point at contracts/
remappings.txt               ← updated with forge-std remapping
```

---

## Task 1: Restructure Project Layout

**Files:**
- Modify: `foundry.toml`
- Modify: `remappings.txt`
- Create: `contracts/src/.gitkeep`, `contracts/test/.gitkeep`, `contracts/script/.gitkeep`
- Create: `shared/addresses.json`, `shared/abis/.gitkeep`
- Delete: `src/`, `test/`, `script/`, `metadata/` (empty dirs)

- [ ] **Step 1: Remove old empty directories and create new structure**

```powershell
# Remove old empty dirs (files already deleted from git in prev commit)
Remove-Item -Recurse -Force src, test, script, metadata -ErrorAction SilentlyContinue

# Create new structure
New-Item -ItemType Directory -Force contracts/src, contracts/test, contracts/script, shared/abis
```

- [ ] **Step 2: Update `foundry.toml`**

Replace the entire file content with:

```toml
[profile.default]
src = "contracts/src"
test = "contracts/test"
script = "contracts/script"
out = "out"
libs = ["lib"]
```

- [ ] **Step 3: Update `remappings.txt`**

Replace the entire file content with:

```
@openzeppelin/=lib/openzeppelin-contracts/
forge-std/=lib/forge-std/src/
```

- [ ] **Step 4: Create `shared/addresses.json`**

```json
{
  "sepolia": {
    "CollectionFactory": "",
    "Marketplace": ""
  }
}
```

- [ ] **Step 5: Verify Foundry still builds**

```bash
forge build
```

Expected output:
```
[⠒] Compiling...
Nothing to compile
Compiler run successful (with warnings)
```

No errors. Zero source files compiled since contracts/src/ is empty — that's expected.

- [ ] **Step 6: Commit**

```bash
git add foundry.toml remappings.txt shared/addresses.json
git add contracts/ shared/
git rm -r --cached src/ test/ script/ metadata/ 2>$null; true
git commit -m "chore: restructure project layout for multi-layer project"
```

---

## Task 2: Install OpenZeppelin

**Files:**
- New submodule: `lib/openzeppelin-contracts/`
- Modify: `foundry.lock`, `.gitmodules`

- [ ] **Step 1: Install OpenZeppelin via Foundry**

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

Expected: Foundry clones OZ into `lib/openzeppelin-contracts/`. No git commit made.

- [ ] **Step 2: Verify remapping works**

Create a temporary file `contracts/src/Test.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
contract Test is ERC721 { constructor() ERC721("T","T"){} }
```

Run:
```bash
forge build
```

Expected: Compiles successfully. Then delete `contracts/src/Test.sol`.

- [ ] **Step 3: Verify .env credentials**

```bash
cast block latest --rpc-url $env:SEPOLIA_RPC_URL
```

Expected: Returns a block number (e.g. `21847392`). If it fails, the Alchemy key is expired — get a new one from dashboard.alchemy.com.

- [ ] **Step 4: Commit**

```bash
git add lib/openzeppelin-contracts .gitmodules foundry.lock
git commit -m "chore: install openzeppelin-contracts v5"
```

---

## Task 3: NFTCollection.sol — Stub + Tests

**Files:**
- Create: `contracts/src/NFTCollection.sol`
- Create: `contracts/test/NFTCollection.t.sol`

- [ ] **Step 1: Create the stub contract**

`contracts/src/NFTCollection.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721URIStorage, ERC2981, Ownable {
    bool public privateMint;
    uint256 public tokenCounter;
    string public collectionURI;

    event NFTMinted(uint256 indexed tokenId, address indexed creator);

    error NotAuthorized();

    constructor(
        string memory name,
        string memory symbol,
        string memory _collectionURI,
        bool _privateMint,
        address owner
    ) ERC721(name, symbol) Ownable(owner) {
        privateMint = _privateMint;
        collectionURI = _collectionURI;
    }

    function mintNFT(
        string memory tokenURI,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) external returns (uint256) {}

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, ERC2981) returns (bool)
    {}
}
```

- [ ] **Step 2: Create the test file**

`contracts/test/NFTCollection.t.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {NFTCollection} from "../src/NFTCollection.sol";

contract NFTCollectionTest is Test {
    NFTCollection public collection;
    NFTCollection public privateCollection;

    address public owner = makeAddr("owner");
    address public user  = makeAddr("user");

    string constant TOKEN_URI = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

    function setUp() public {
        collection        = new NFTCollection("KalaKriti", "KK",  "ipfs://colURI", false, owner);
        privateCollection = new NFTCollection("Private",   "PVT", "ipfs://colURI", true,  owner);
    }

    function test_mintNFT_returnsTokenId() public {
        vm.prank(user);
        uint256 tokenId = collection.mintNFT(TOKEN_URI, user, 500);
        assertEq(tokenId, 0);
    }

    function test_mintNFT_mintsToSender() public {
        vm.prank(user);
        collection.mintNFT(TOKEN_URI, user, 500);
        assertEq(collection.ownerOf(0), user);
    }

    function test_mintNFT_storesTokenURI() public {
        vm.prank(user);
        collection.mintNFT(TOKEN_URI, user, 500);
        assertEq(collection.tokenURI(0), TOKEN_URI);
    }

    function test_mintNFT_incrementsCounter() public {
        vm.startPrank(user);
        collection.mintNFT(TOKEN_URI, user, 500);
        collection.mintNFT(TOKEN_URI, user, 500);
        vm.stopPrank();
        assertEq(collection.tokenCounter(), 2);
    }

    function test_mintNFT_setsRoyalty() public {
        vm.prank(user);
        collection.mintNFT(TOKEN_URI, user, 500); // 5% royalty
        (address receiver, uint256 amount) = collection.royaltyInfo(0, 10_000);
        assertEq(receiver, user);
        assertEq(amount, 500); // 5% of 10000
    }

    function test_mintNFT_emitsEvent() public {
        vm.prank(user);
        vm.expectEmit(true, true, false, false);
        emit NFTCollection.NFTMinted(0, user);
        collection.mintNFT(TOKEN_URI, user, 500);
    }

    function test_mintNFT_private_ownerSucceeds() public {
        vm.prank(owner);
        uint256 tokenId = privateCollection.mintNFT(TOKEN_URI, owner, 500);
        assertEq(tokenId, 0);
    }

    function test_mintNFT_private_userReverts() public {
        vm.prank(user);
        vm.expectRevert(NFTCollection.NotAuthorized.selector);
        privateCollection.mintNFT(TOKEN_URI, user, 500);
    }

    function test_supportsInterface_ERC721() public view {
        assertTrue(collection.supportsInterface(0x80ac58cd));
    }

    function test_supportsInterface_ERC2981() public view {
        assertTrue(collection.supportsInterface(0x2a55205a));
    }

    function test_supportsInterface_ERC165() public view {
        assertTrue(collection.supportsInterface(0x01ffc9a7));
    }
}
```

- [ ] **Step 3: Run tests — confirm they FAIL**

```bash
forge test --match-path contracts/test/NFTCollection.t.sol -v
```

Expected: Multiple FAIL results. `mintNFT` returns 0 by default (empty function body), ownership checks fail, royalty not set. Tests for stub functions that don't return anything meaningful yet.

- [ ] **Step 4: Commit stub + tests**

```bash
git add contracts/src/NFTCollection.sol contracts/test/NFTCollection.t.sol
git commit -m "test(nft): add NFTCollection stub and failing tests"
```

---

## Task 4: NFTCollection.sol — Implementation

**Files:**
- Modify: `contracts/src/NFTCollection.sol`

- [ ] **Step 1: Implement `mintNFT` and `supportsInterface`**

Replace the entire `contracts/src/NFTCollection.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is ERC721URIStorage, ERC2981, Ownable {
    bool public privateMint;
    uint256 public tokenCounter;
    string public collectionURI;

    event NFTMinted(uint256 indexed tokenId, address indexed creator);

    error NotAuthorized();

    constructor(
        string memory name,
        string memory symbol,
        string memory _collectionURI,
        bool _privateMint,
        address owner
    ) ERC721(name, symbol) Ownable(owner) {
        privateMint = _privateMint;
        collectionURI = _collectionURI;
    }

    function mintNFT(
        string memory tokenURI,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) external returns (uint256) {
        if (privateMint && msg.sender != owner()) revert NotAuthorized();

        uint256 tokenId = tokenCounter;
        tokenCounter++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeNumerator);

        emit NFTMinted(tokenId, msg.sender);
        return tokenId;
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, ERC2981) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

- [ ] **Step 2: Run tests — confirm they all PASS**

```bash
forge test --match-path contracts/test/NFTCollection.t.sol -v
```

Expected:
```
[PASS] test_mintNFT_returnsTokenId()
[PASS] test_mintNFT_mintsToSender()
[PASS] test_mintNFT_storesTokenURI()
[PASS] test_mintNFT_incrementsCounter()
[PASS] test_mintNFT_setsRoyalty()
[PASS] test_mintNFT_emitsEvent()
[PASS] test_mintNFT_private_ownerSucceeds()
[PASS] test_mintNFT_private_userReverts()
[PASS] test_supportsInterface_ERC721()
[PASS] test_supportsInterface_ERC2981()
[PASS] test_supportsInterface_ERC165()
```

All 11 tests pass.

- [ ] **Step 3: Commit**

```bash
git add contracts/src/NFTCollection.sol
git commit -m "feat(contracts): implement NFTCollection with ERC2981 royalties"
```

---

## Task 5: CollectionFactory.sol — Stub, Tests, Implementation

**Files:**
- Create: `contracts/src/CollectionFactory.sol`
- Create: `contracts/test/CollectionFactory.t.sol`

- [ ] **Step 1: Create the stub**

`contracts/src/CollectionFactory.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {NFTCollection} from "./NFTCollection.sol";

contract CollectionFactory {
    address[] public allCollections;
    mapping(address => address[]) public collectionsByOwner;

    event CollectionCreated(address indexed collectionAddress, address indexed owner);

    function createCollection(
        string memory name,
        string memory symbol,
        string memory collectionURI,
        bool privateMint
    ) external returns (address) {}

    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    function getCollectionsByOwner(address owner) external view returns (address[] memory) {
        return collectionsByOwner[owner];
    }
}
```

- [ ] **Step 2: Create tests**

`contracts/test/CollectionFactory.t.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CollectionFactory} from "../src/CollectionFactory.sol";
import {NFTCollection} from "../src/NFTCollection.sol";

contract CollectionFactoryTest is Test {
    CollectionFactory public factory;

    address public alice = makeAddr("alice");
    address public bob   = makeAddr("bob");

    function setUp() public {
        factory = new CollectionFactory();
    }

    function test_createCollection_returnsAddress() public {
        vm.prank(alice);
        address addr = factory.createCollection("Art", "ART", "ipfs://uri", false);
        assertTrue(addr != address(0));
    }

    function test_createCollection_storesInAllCollections() public {
        vm.prank(alice);
        address addr = factory.createCollection("Art", "ART", "ipfs://uri", false);
        assertEq(factory.allCollections(0), addr);
        assertEq(factory.getAllCollections().length, 1);
    }

    function test_createCollection_storesByOwner() public {
        vm.prank(alice);
        address addr = factory.createCollection("Art", "ART", "ipfs://uri", false);
        assertEq(factory.getCollectionsByOwner(alice).length, 1);
        assertEq(factory.getCollectionsByOwner(alice)[0], addr);
    }

    function test_createCollection_setsCollectionOwner() public {
        vm.prank(alice);
        address addr = factory.createCollection("Art", "ART", "ipfs://uri", false);
        assertEq(NFTCollection(addr).owner(), alice);
    }

    function test_createCollection_setsPrivateMint() public {
        vm.prank(alice);
        address addr = factory.createCollection("Private", "PVT", "ipfs://uri", true);
        assertTrue(NFTCollection(addr).privateMint());
    }

    function test_createCollection_emitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(false, true, false, false); // skip addr check, check owner
        emit CollectionFactory.CollectionCreated(address(0), alice);
        factory.createCollection("Art", "ART", "ipfs://uri", false);
    }

    function test_createCollection_multipleByOneOwner() public {
        vm.startPrank(alice);
        factory.createCollection("Art1", "A1", "ipfs://uri1", false);
        factory.createCollection("Art2", "A2", "ipfs://uri2", false);
        vm.stopPrank();

        assertEq(factory.getAllCollections().length, 2);
        assertEq(factory.getCollectionsByOwner(alice).length, 2);
    }

    function test_createCollection_separatesOwners() public {
        vm.prank(alice);
        factory.createCollection("AliceArt", "AA", "ipfs://uri", false);
        vm.prank(bob);
        factory.createCollection("BobArt",   "BA", "ipfs://uri", false);

        assertEq(factory.getCollectionsByOwner(alice).length, 1);
        assertEq(factory.getCollectionsByOwner(bob).length,   1);
        assertEq(factory.getAllCollections().length, 2);
    }
}
```

- [ ] **Step 3: Run tests — confirm FAIL**

```bash
forge test --match-path contracts/test/CollectionFactory.t.sol -v
```

Expected: All tests FAIL — `createCollection` returns `address(0)`.

- [ ] **Step 4: Implement `createCollection`**

Replace `contracts/src/CollectionFactory.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {NFTCollection} from "./NFTCollection.sol";

contract CollectionFactory {
    address[] public allCollections;
    mapping(address => address[]) public collectionsByOwner;

    event CollectionCreated(address indexed collectionAddress, address indexed owner);

    function createCollection(
        string memory name,
        string memory symbol,
        string memory collectionURI,
        bool privateMint
    ) external returns (address) {
        NFTCollection collection = new NFTCollection(
            name,
            symbol,
            collectionURI,
            privateMint,
            msg.sender
        );

        address collectionAddr = address(collection);
        allCollections.push(collectionAddr);
        collectionsByOwner[msg.sender].push(collectionAddr);

        emit CollectionCreated(collectionAddr, msg.sender);
        return collectionAddr;
    }

    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    function getCollectionsByOwner(address owner) external view returns (address[] memory) {
        return collectionsByOwner[owner];
    }
}
```

- [ ] **Step 5: Run tests — confirm all PASS**

```bash
forge test --match-path contracts/test/CollectionFactory.t.sol -v
```

Expected: All 8 tests pass.

- [ ] **Step 6: Commit**

```bash
git add contracts/src/CollectionFactory.sol contracts/test/CollectionFactory.t.sol
git commit -m "feat(contracts): implement CollectionFactory"
```

---

## Task 6: Marketplace.sol — Stub + Tests

**Files:**
- Create: `contracts/src/Marketplace.sol`
- Create: `contracts/test/Marketplace.t.sol`

- [ ] **Step 1: Create the stub**

`contracts/src/Marketplace.sol`:
```solidity
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
```

- [ ] **Step 2: Create the test file**

`contracts/test/Marketplace.t.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Marketplace} from "../src/Marketplace.sol";
import {NFTCollection} from "../src/NFTCollection.sol";

contract MarketplaceTest is Test {
    Marketplace   public marketplace;
    NFTCollection public collection;

    address public deployer      = makeAddr("deployer");
    address public feeRecipient  = makeAddr("feeRecipient");
    address public seller        = makeAddr("seller");
    address public buyer         = makeAddr("buyer");
    address public royaltyTarget = makeAddr("royaltyTarget");

    uint96  constant ROYALTY_BPS = 500;   // 5%
    uint256 constant PRICE       = 1 ether;

    function setUp() public {
        vm.prank(deployer);
        marketplace = new Marketplace(feeRecipient);

        // Public collection, deployer owns it
        collection = new NFTCollection("KalaKriti", "KK", "ipfs://col", false, deployer);

        // Mint token 0 to seller, royalty goes to royaltyTarget
        vm.prank(seller);
        collection.mintNFT("ipfs://token0", royaltyTarget, ROYALTY_BPS);

        // Seller approves marketplace for token 0
        vm.prank(seller);
        collection.approve(address(marketplace), 0);
    }

    // ─── listNFT ───────────────────────────────────────────────────────────────

    function test_listNFT_success() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        (address s, address c, uint256 tid, uint256 p, bool active) = marketplace.listings(id);
        assertEq(s,   seller);
        assertEq(c,   address(collection));
        assertEq(tid, 0);
        assertEq(p,   PRICE);
        assertTrue(active);
    }

    function test_listNFT_setsNftIsListed() public {
        vm.prank(seller);
        marketplace.listNFT(address(collection), 0, PRICE);
        assertTrue(marketplace.nftIsListed(address(collection), 0));
    }

    function test_listNFT_emitsEvent() public {
        vm.prank(seller);
        vm.expectEmit(true, true, true, true);
        emit Marketplace.NFTListed(0, seller, address(collection), 0, PRICE);
        marketplace.listNFT(address(collection), 0, PRICE);
    }

    function test_listNFT_revertsNotOwner() public {
        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotOwner.selector);
        marketplace.listNFT(address(collection), 0, PRICE);
    }

    function test_listNFT_revertsPriceZero() public {
        vm.prank(seller);
        vm.expectRevert(Marketplace.PriceZero.selector);
        marketplace.listNFT(address(collection), 0, 0);
    }

    function test_listNFT_revertsAlreadyListed() public {
        vm.prank(seller);
        marketplace.listNFT(address(collection), 0, PRICE);

        vm.prank(seller);
        vm.expectRevert(Marketplace.AlreadyListed.selector);
        marketplace.listNFT(address(collection), 0, PRICE);
    }

    function test_listNFT_revertsNotApproved() public {
        // Revoke approval
        vm.prank(seller);
        collection.approve(address(0), 0);

        vm.prank(seller);
        vm.expectRevert(Marketplace.NotApproved.selector);
        marketplace.listNFT(address(collection), 0, PRICE);
    }

    function test_listNFT_approvedForAll() public {
        // Revoke single approval, set approvalForAll instead
        vm.startPrank(seller);
        collection.approve(address(0), 0);
        collection.setApprovalForAll(address(marketplace), true);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.stopPrank();
        (, , , , bool active) = marketplace.listings(id);
        assertTrue(active);
    }

    // ─── cancelListing ────────────────────────────────────────────────────────

    function test_cancelListing_success() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.prank(seller);
        marketplace.cancelListing(id);

        (, , , , bool active) = marketplace.listings(id);
        assertFalse(active);
        assertFalse(marketplace.nftIsListed(address(collection), 0));
    }

    function test_cancelListing_emitsEvent() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.prank(seller);
        vm.expectEmit(true, false, false, false);
        emit Marketplace.ListingCancelled(id);
        marketplace.cancelListing(id);
    }

    function test_cancelListing_revertsNotSeller() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotSeller.selector);
        marketplace.cancelListing(id);
    }

    function test_cancelListing_revertsNotListed() public {
        vm.prank(seller);
        vm.expectRevert(Marketplace.NotListed.selector);
        marketplace.cancelListing(999);
    }

    function test_cancelListing_allowsRelist() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.prank(seller);
        marketplace.cancelListing(id);

        // Should be able to list again
        vm.prank(seller);
        uint256 id2 = marketplace.listNFT(address(collection), 0, PRICE);
        (, , , , bool active) = marketplace.listings(id2);
        assertTrue(active);
    }

    // ─── buyNFT ───────────────────────────────────────────────────────────────

    function test_buyNFT_transfersOwnership() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        assertEq(collection.ownerOf(0), buyer);
    }

    function test_buyNFT_deactivatesListing() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        (, , , , bool active) = marketplace.listings(id);
        assertFalse(active);
        assertFalse(marketplace.nftIsListed(address(collection), 0));
    }

    function test_buyNFT_distributesPayments() public {
        // PRICE = 1 ether
        // royalty = 5% = 0.05 ether → royaltyTarget
        // fee    = 2% = 0.02 ether → feeRecipient
        // seller = 93% = 0.93 ether → seller
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        assertEq(marketplace.pendingWithdrawals(royaltyTarget), 0.05 ether);
        assertEq(marketplace.pendingWithdrawals(feeRecipient),  0.02 ether);
        assertEq(marketplace.pendingWithdrawals(seller),        0.93 ether);
    }

    function test_buyNFT_emitsEvent() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectEmit(true, true, true, false);
        emit Marketplace.NFTSold(id, buyer, seller, 0, PRICE);
        marketplace.buyNFT{value: PRICE}(id);
    }

    function test_buyNFT_revertsWrongPrice() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.WrongPrice.selector);
        marketplace.buyNFT{value: 0.5 ether}(id);
    }

    function test_buyNFT_revertsNotListed() public {
        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotListed.selector);
        marketplace.buyNFT{value: PRICE}(999);
    }

    function test_buyNFT_revertsSelfPurchase() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        vm.deal(seller, PRICE);
        vm.prank(seller);
        vm.expectRevert(Marketplace.SelfPurchase.selector);
        marketplace.buyNFT{value: PRICE}(id);
    }

    function test_buyNFT_revertsSellerNoLongerOwner() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);

        // Seller transfers NFT away (clears approval too)
        vm.prank(seller);
        collection.transferFrom(seller, makeAddr("thirdParty"), 0);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotOwner.selector);
        marketplace.buyNFT{value: PRICE}(id);
    }

    function test_buyNFT_revertsInactiveListing() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.prank(seller);
        marketplace.cancelListing(id);

        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert(Marketplace.NotListed.selector);
        marketplace.buyNFT{value: PRICE}(id);
    }

    // ─── withdrawFunds ────────────────────────────────────────────────────────

    function test_withdrawFunds_success() public {
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        uint256 owed = marketplace.pendingWithdrawals(seller);

        vm.prank(seller);
        marketplace.withdrawFunds();

        assertEq(seller.balance, owed);
        assertEq(marketplace.pendingWithdrawals(seller), 0);
    }

    function test_withdrawFunds_revertsNoFunds() public {
        vm.prank(seller);
        vm.expectRevert(Marketplace.NoFunds.selector);
        marketplace.withdrawFunds();
    }

    function test_withdrawFunds_zeroesBeforeTransfer() public {
        // Verify balance is cleared before ETH transfer (CEI pattern)
        vm.prank(seller);
        uint256 id = marketplace.listNFT(address(collection), 0, PRICE);
        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        marketplace.buyNFT{value: PRICE}(id);

        vm.prank(seller);
        marketplace.withdrawFunds();

        // Attempting to withdraw again must revert
        vm.prank(seller);
        vm.expectRevert(Marketplace.NoFunds.selector);
        marketplace.withdrawFunds();
    }
}
```

- [ ] **Step 3: Run tests — confirm FAIL**

```bash
forge test --match-path contracts/test/Marketplace.t.sol -v
```

Expected: Most tests fail — stub functions have empty bodies.

- [ ] **Step 4: Commit stub + tests**

```bash
git add contracts/src/Marketplace.sol contracts/test/Marketplace.t.sol
git commit -m "test(marketplace): add Marketplace stub and failing tests"
```

---

## Task 7: Marketplace.sol — Implementation

**Files:**
- Modify: `contracts/src/Marketplace.sol`

- [ ] **Step 1: Implement all functions**

Replace the entire `contracts/src/Marketplace.sol`:
```solidity
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
```

- [ ] **Step 2: Run tests — confirm all PASS**

```bash
forge test --match-path contracts/test/Marketplace.t.sol -v
```

Expected: All 22 tests pass.

- [ ] **Step 3: Run full test suite**

```bash
forge test -v
```

Expected: All tests across all three files pass. Zero failures.

- [ ] **Step 4: Commit**

```bash
git add contracts/src/Marketplace.sol
git commit -m "feat(contracts): implement Marketplace with royalties and pull payments"
```

---

## Task 8: Integration Test

**Files:**
- Create: `contracts/test/Integration.t.sol`

- [ ] **Step 1: Create the integration test**

`contracts/test/Integration.t.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CollectionFactory} from "../src/CollectionFactory.sol";
import {NFTCollection} from "../src/NFTCollection.sol";
import {Marketplace} from "../src/Marketplace.sol";

contract IntegrationTest is Test {
    CollectionFactory public factory;
    Marketplace       public marketplace;

    address public platform = makeAddr("platform");
    address public artist   = makeAddr("artist");
    address public buyer1   = makeAddr("buyer1");
    address public buyer2   = makeAddr("buyer2");

    function setUp() public {
        factory     = new CollectionFactory();
        marketplace = new Marketplace(platform);
    }

    function test_fullFlow_mintListBuyWithdraw() public {
        // 1. Artist creates a collection
        vm.prank(artist);
        address collectionAddr = factory.createCollection("ArtByArtist", "ABA", "ipfs://col", false);
        NFTCollection collection = NFTCollection(collectionAddr);

        // 2. Artist mints an NFT (artist gets 5% royalty on resales)
        vm.prank(artist);
        uint256 tokenId = collection.mintNFT("ipfs://token0", artist, 500);
        assertEq(collection.ownerOf(tokenId), artist);

        // 3. Artist approves marketplace and lists for 1 ETH
        vm.startPrank(artist);
        collection.approve(address(marketplace), tokenId);
        uint256 listingId = marketplace.listNFT(collectionAddr, tokenId, 1 ether);
        vm.stopPrank();

        // 4. Buyer1 purchases
        vm.deal(buyer1, 1 ether);
        vm.prank(buyer1);
        marketplace.buyNFT{value: 1 ether}(listingId);

        assertEq(collection.ownerOf(tokenId), buyer1);

        // Payment distribution: 1 ETH total
        // royalty = 5% = 0.05 ETH → artist
        // fee     = 2% = 0.02 ETH → platform
        // seller  = 93%= 0.93 ETH → artist (was minter/seller both)
        // artist total pending = 0.05 + 0.93 = 0.98 ETH
        assertEq(marketplace.pendingWithdrawals(artist),   0.98 ether);
        assertEq(marketplace.pendingWithdrawals(platform), 0.02 ether);

        // 5. Buyer1 relists for 2 ETH
        vm.startPrank(buyer1);
        collection.approve(address(marketplace), tokenId);
        uint256 listingId2 = marketplace.listNFT(collectionAddr, tokenId, 2 ether);
        vm.stopPrank();

        // 6. Buyer2 purchases from buyer1
        vm.deal(buyer2, 2 ether);
        vm.prank(buyer2);
        marketplace.buyNFT{value: 2 ether}(listingId2);

        assertEq(collection.ownerOf(tokenId), buyer2);

        // On 2 ETH sale:
        // royalty = 5% = 0.1 ETH → artist
        // fee     = 2% = 0.04 ETH → platform
        // seller  = 93%= 1.86 ETH → buyer1
        assertEq(marketplace.pendingWithdrawals(buyer1),   1.86 ether);
        assertEq(marketplace.pendingWithdrawals(artist),   0.98 ether + 0.1 ether); // + secondary royalty
        assertEq(marketplace.pendingWithdrawals(platform), 0.02 ether + 0.04 ether);

        // 7. All parties withdraw
        vm.prank(artist);
        marketplace.withdrawFunds();
        assertEq(artist.balance, 1.08 ether);

        vm.prank(buyer1);
        marketplace.withdrawFunds();
        assertEq(buyer1.balance, 1.86 ether);

        vm.prank(platform);
        marketplace.withdrawFunds();
        assertEq(platform.balance, 0.06 ether);
    }

    function test_fullFlow_cancelAndRelist() public {
        vm.prank(artist);
        address collectionAddr = factory.createCollection("Art", "A", "ipfs://col", false);
        NFTCollection collection = NFTCollection(collectionAddr);

        vm.prank(artist);
        uint256 tokenId = collection.mintNFT("ipfs://token0", artist, 500);

        vm.startPrank(artist);
        collection.approve(address(marketplace), tokenId);
        uint256 id1 = marketplace.listNFT(collectionAddr, tokenId, 1 ether);
        marketplace.cancelListing(id1);

        // Must approve again after cancel (approval still held since NFT didn't move)
        uint256 id2 = marketplace.listNFT(collectionAddr, tokenId, 2 ether);
        vm.stopPrank();

        (, , , uint256 price, bool active) = marketplace.listings(id2);
        assertEq(price, 2 ether);
        assertTrue(active);
    }
}
```

- [ ] **Step 2: Run integration tests**

```bash
forge test --match-path contracts/test/Integration.t.sol -v
```

Expected: Both tests pass.

- [ ] **Step 3: Run complete suite + gas report**

```bash
forge test --gas-report
```

Expected: All tests pass. Review gas costs — `buyNFT` should be under 150k gas.

- [ ] **Step 4: Commit**

```bash
git add contracts/test/Integration.t.sol
git commit -m "test(contracts): add end-to-end integration test"
```

---

## Task 9: Deploy Script + ABI Export

**Files:**
- Create: `contracts/script/DeployAll.s.sol`
- Modify: `shared/addresses.json`
- Create: `shared/abis/NFTCollection.json`, `CollectionFactory.json`, `Marketplace.json`

- [ ] **Step 1: Create deploy script**

`contracts/script/DeployAll.s.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CollectionFactory} from "../src/CollectionFactory.sol";
import {Marketplace} from "../src/Marketplace.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        CollectionFactory factory     = new CollectionFactory();
        Marketplace       marketplace = new Marketplace(deployer);

        vm.stopBroadcast();

        console.log("CollectionFactory:", address(factory));
        console.log("Marketplace:      ", address(marketplace));
        console.log("Network: Sepolia");
        console.log("Deployer:", deployer);

        string memory json = string.concat(
            '{"sepolia":{"CollectionFactory":"',
            vm.toString(address(factory)),
            '","Marketplace":"',
            vm.toString(address(marketplace)),
            '"}}'
        );
        vm.writeJson(json, "./shared/addresses.json");
    }
}
```

- [ ] **Step 2: Dry-run locally with Anvil**

In one terminal, start a local node:
```bash
anvil
```

In another terminal, test the deploy against local Anvil (use Anvil's test private key):
```bash
forge script contracts/script/DeployAll.s.sol:DeployAll \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Expected: Script runs, logs two contract addresses, writes `shared/addresses.json`.

Verify `shared/addresses.json` now has addresses. Stop Anvil.

- [ ] **Step 3: Export ABIs**

```bash
forge build

forge inspect contracts/src/NFTCollection.sol:NFTCollection abi > shared/abis/NFTCollection.json
forge inspect contracts/src/CollectionFactory.sol:CollectionFactory abi > shared/abis/CollectionFactory.json
forge inspect contracts/src/Marketplace.sol:Marketplace abi > shared/abis/Marketplace.json
```

Expected: Three JSON files created in `shared/abis/`. Each contains an array of ABI entries.

- [ ] **Step 4: Commit**

```bash
git add contracts/script/DeployAll.s.sol shared/abis/
git commit -m "feat(contracts): add deploy script and export ABIs"
```

---

## Task 10: Sepolia Deployment + Verification

**Files:**
- Modify: `shared/addresses.json` (auto-updated by script)

- [ ] **Step 1: Deploy to Sepolia**

> Note: Run these in Git Bash (not PowerShell) — backslash line continuation is bash syntax. Or paste as one line in PowerShell.

```bash
forge script contracts/script/DeployAll.s.sol:DeployAll \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

Expected output:
```
CollectionFactory: 0x...
Marketplace:       0x...
```

Both contracts verified on Sepolia Etherscan automatically.

If `--verify` fails (sometimes it times out), verify manually in Step 2.

- [ ] **Step 2: (If needed) Manual Etherscan verification**

```bash
forge verify-contract <FACTORY_ADDRESS> \
  contracts/src/CollectionFactory.sol:CollectionFactory \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY

forge verify-contract <MARKETPLACE_ADDRESS> \
  contracts/src/Marketplace.sol:Marketplace \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" <DEPLOYER_ADDRESS>)
```

> Run in Git Bash. Replace `<FACTORY_ADDRESS>`, `<MARKETPLACE_ADDRESS>`, `<DEPLOYER_ADDRESS>` with actual values from `shared/addresses.json` and your wallet address.

- [ ] **Step 3: Confirm on Etherscan**

Open these URLs in browser:
- `https://sepolia.etherscan.io/address/<FACTORY_ADDRESS>#code`
- `https://sepolia.etherscan.io/address/<MARKETPLACE_ADDRESS>#code`

Both should show "Contract" tab with verified source code (green checkmark).

- [ ] **Step 4: Smoke test deployed contracts**

```bash
# Check factory on Sepolia
cast call <FACTORY_ADDRESS> "getAllCollections()(address[])" --rpc-url $env:SEPOLIA_RPC_URL

# Check marketplace fee BPS
cast call <MARKETPLACE_ADDRESS> "MARKETPLACE_FEE_BPS()(uint256)" --rpc-url $env:SEPOLIA_RPC_URL
```

Expected:
- Factory returns `[]` (no collections yet)
- Marketplace returns `200`

- [ ] **Step 5: Commit final state**

```bash
git add shared/addresses.json
git commit -m "deploy: contracts live on Sepolia"
```

- [ ] **Step 6: Update CLAUDE.md with deployed addresses**

Edit `CLAUDE.md` — fill in the Deployed Contract Addresses section with the actual addresses from `shared/addresses.json`.

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Sepolia contract addresses"
```

---

## Completion Checklist

- [ ] All 3 contracts implemented and compiling
- [ ] NFTCollection: 11 unit tests passing
- [ ] CollectionFactory: 8 unit tests passing
- [ ] Marketplace: 22 unit tests passing
- [ ] Integration: 2 end-to-end tests passing
- [ ] `forge test --gas-report` shows no failures
- [ ] `shared/addresses.json` has real Sepolia addresses
- [ ] `shared/abis/` has 3 ABI files
- [ ] Both contracts verified on Sepolia Etherscan
- [ ] `cast call` smoke tests pass against live Sepolia

**Next plan:** `2026-05-23-phase-2-backend-indexer.md` (write when ready to start Phase 2)
