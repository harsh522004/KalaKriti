const GATEWAY = import.meta.env.VITE_PINATA_GATEWAY ?? 'https://gateway.pinata.cloud';

export function resolveIpfs(uri: string): string {
  if (!uri) return '';
  if (uri.startsWith('ipfs://')) {
    return `${GATEWAY}/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

export async function uploadFileToPinata(file: File): Promise<string> {
  const jwt = import.meta.env.VITE_PINATA_JWT as string;
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) throw new Error('Pinata file upload failed');
  const data = await res.json() as { IpfsHash: string };
  return `ipfs://${data.IpfsHash}`;
}

export async function uploadJsonToPinata(metadata: object): Promise<string> {
  const jwt = import.meta.env.VITE_PINATA_JWT as string;
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pinataContent: metadata }),
  });
  if (!res.ok) throw new Error('Pinata JSON upload failed');
  const data = await res.json() as { IpfsHash: string };
  return `ipfs://${data.IpfsHash}`;
}
