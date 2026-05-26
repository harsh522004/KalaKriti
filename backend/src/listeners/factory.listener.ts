import { parseAbi, parseAbiItem } from 'viem';
import { publicClient } from './client';
import { upsertCollection } from '../services/collection.service';

const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS as `0x${string}`;

const COLLECTION_CREATED = parseAbiItem(
  'event CollectionCreated(address indexed collectionAddress, address indexed owner)'
);

const NFT_COLLECTION_READ_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function collectionURI() view returns (string)',
  'function privateMint() view returns (bool)',
]);

export async function processFactoryLogs(fromBlock: bigint, toBlock: bigint) {
  const logs = await publicClient.getLogs({
    address: FACTORY_ADDRESS,
    event: COLLECTION_CREATED,
    fromBlock,
    toBlock,
  });

  for (const log of logs) {
    const { collectionAddress, owner } = log.args as {
      collectionAddress: `0x${string}`;
      owner: `0x${string}`;
    };

    const [name, symbol, metadataURI, privateMint] = await Promise.all([
      publicClient.readContract({ address: collectionAddress, abi: NFT_COLLECTION_READ_ABI, functionName: 'name' }),
      publicClient.readContract({ address: collectionAddress, abi: NFT_COLLECTION_READ_ABI, functionName: 'symbol' }),
      publicClient.readContract({ address: collectionAddress, abi: NFT_COLLECTION_READ_ABI, functionName: 'collectionURI' }),
      publicClient.readContract({ address: collectionAddress, abi: NFT_COLLECTION_READ_ABI, functionName: 'privateMint' }),
    ]);

    await upsertCollection({
      address: collectionAddress,
      owner,
      name: name as string,
      symbol: symbol as string,
      metadataURI: metadataURI as string,
      privateMint: privateMint as boolean,
    });
  }
}
