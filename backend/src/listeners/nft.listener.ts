import { parseAbi, parseAbiItem } from 'viem';
import { publicClient } from './client';
import { upsertNFT, updateNFTOwner } from '../services/nft.service';

const NFT_MINTED = parseAbiItem(
  'event NFTMinted(uint256 indexed tokenId, address indexed creator)'
);

const ERC721_TRANSFER = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
);

const NFT_READ_ABI = parseAbi([
  'function tokenURI(uint256) view returns (string)',
  'function royaltyInfo(uint256, uint256) view returns (address, uint256)',
]);

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export async function processNFTLogs(
  collectionAddresses: `0x${string}`[],
  fromBlock: bigint,
  toBlock: bigint
) {
  if (collectionAddresses.length === 0) return;

  const mintLogs = await publicClient.getLogs({
    address: collectionAddresses,
    event: NFT_MINTED,
    fromBlock,
    toBlock,
  });

  for (const log of mintLogs) {
    const { tokenId, creator } = log.args as { tokenId: bigint; creator: `0x${string}` };
    const collectionAddress = log.address;
    const tokenIdNum = Number(tokenId);

    const [tokenURI, royaltyResult] = await Promise.all([
      publicClient.readContract({
        address: collectionAddress,
        abi: NFT_READ_ABI,
        functionName: 'tokenURI',
        args: [tokenId],
      }),
      publicClient.readContract({
        address: collectionAddress,
        abi: NFT_READ_ABI,
        functionName: 'royaltyInfo',
        args: [tokenId, 10000n],
      }),
    ]);

    const [, royaltyAmount] = royaltyResult as [string, bigint];

    await upsertNFT({
      tokenId: tokenIdNum,
      collectionAddress,
      owner: creator,
      creator,
      tokenURI: tokenURI as string,
      royaltyPct: Number(royaltyAmount),
    });
  }

  const transferLogs = await publicClient.getLogs({
    address: collectionAddresses,
    event: ERC721_TRANSFER,
    fromBlock,
    toBlock,
  });

  for (const log of transferLogs) {
    const { from, to, tokenId } = log.args as {
      from: `0x${string}`;
      to: `0x${string}`;
      tokenId: bigint;
    };
    if (from === ZERO_ADDRESS) continue;
    await updateNFTOwner(log.address, Number(tokenId), to);
  }
}
