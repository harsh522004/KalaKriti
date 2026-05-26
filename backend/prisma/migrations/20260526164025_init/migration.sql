-- CreateTable
CREATE TABLE "Collection" (
    "address" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "metadataURI" TEXT NOT NULL,
    "privateMint" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "NFT" (
    "id" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "collectionAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "tokenURI" TEXT NOT NULL,
    "royaltyPct" INTEGER NOT NULL DEFAULT 0,
    "isListed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NFT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "listingId" INTEGER NOT NULL,
    "collectionAddress" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "seller" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("listingId")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "collectionAddress" TEXT NOT NULL,
    "price" TEXT,
    "txHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastBlock" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NFT_tokenId_collectionAddress_key" ON "NFT"("tokenId", "collectionAddress");

-- AddForeignKey
ALTER TABLE "NFT" ADD CONSTRAINT "NFT_collectionAddress_fkey" FOREIGN KEY ("collectionAddress") REFERENCES "Collection"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_collectionAddress_fkey" FOREIGN KEY ("collectionAddress") REFERENCES "Collection"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
