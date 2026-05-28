import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import ImageUpload from '@/features/mint/ImageUpload';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useCollections } from '@/hooks/useCollections';
import { uploadFileToPinata, uploadJsonToPinata } from '@/lib/ipfs';
import { NFTCollectionAbi } from '@/lib/abis';

type MintStep = 'form' | 'uploading' | 'minting' | 'done';

export default function Mint() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const { data: collections = [] } = useCollections();
  const myCollections = collections.filter(c => c.owner.toLowerCase() === (address?.toLowerCase() ?? ''));

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState({ name: '', description: '', royalty: '500', collectionAddress: '' });
  const [step, setStep] = useState<MintStep>('form');
  const [statusMsg, setStatusMsg] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess && step === 'minting') setStep('done');

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleMint = async () => {
    if (!file || !form.name || !form.collectionAddress || !address) return;
    try {
      setStep('uploading');
      setStatusMsg('Uploading image to IPFS...');
      const imageUri = await uploadFileToPinata(file);

      setStatusMsg('Uploading metadata to IPFS...');
      const metadataUri = await uploadJsonToPinata({
        name: form.name,
        description: form.description,
        image: imageUri,
      });

      setStep('minting');
      setStatusMsg('Confirm mint transaction in wallet...');
      writeContract({
        address: form.collectionAddress as `0x${string}`,
        abi: NFTCollectionAbi,
        functionName: 'mintNFT',
        args: [metadataUri, address, BigInt(form.royalty)],
      });
    } catch (err) {
      console.error(err);
      setStep('form');
      setStatusMsg('Upload failed. Please try again.');
    }
  };

  if (step === 'done') {
    return (
      <PageWrapper>
        <div className="max-w-page mx-auto px-6 py-24 flex flex-col items-center gap-6 text-center">
          <img src="/logo-icon.png" alt="KalaKriti" className="w-24 opacity-80" />
          <h2 className="font-serif text-[48px] text-ivory">NFT Minted!</h2>
          <p className="font-sans text-[16px] text-secondary max-w-sm">
            Your NFT has been minted on Sepolia. It will appear in your profile once the indexer processes the block.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => void navigate('/profile')}>View Profile</Button>
            <Button variant="secondary" onClick={() => { setStep('form'); setFile(null); setPreview(''); }}>
              Mint Another
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-page mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-gold mb-2">Create</p>
          <h1 className="font-serif text-[48px] text-ivory">Mint New NFT</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          <ImageUpload onFile={handleFile} preview={preview} />

          <div className="space-y-6">
            <div>
              <label className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted block mb-2">
                Collection *
              </label>
              {myCollections.length === 0 ? (
                <p className="font-sans text-[14px] text-muted">
                  You have no collections.{' '}
                  <a href="/collections" className="text-gold underline">Create one first.</a>
                </p>
              ) : (
                <select
                  value={form.collectionAddress}
                  onChange={e => setForm(f => ({ ...f, collectionAddress: e.target.value }))}
                  className="w-full bg-elevated border border-white/10 rounded-input px-4 py-3 font-sans text-[14px] text-ivory focus:outline-none focus:border-gold/40"
                >
                  <option value="">Select a collection</option>
                  {myCollections.map(c => (
                    <option key={c.address} value={c.address}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted block mb-2">Name *</label>
              <input
                type="text"
                placeholder="Timeless Grace"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-input px-4 py-3 font-sans text-[14px] text-ivory placeholder:text-muted focus:outline-none focus:border-gold/40"
              />
            </div>

            <div>
              <label className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted block mb-2">Description</label>
              <textarea
                rows={4}
                placeholder="Describe your artwork..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-input px-4 py-3 font-sans text-[14px] text-ivory placeholder:text-muted focus:outline-none focus:border-gold/40 resize-none"
              />
            </div>

            <div>
              <label className="font-sans text-[12px] uppercase tracking-[0.08em] text-muted block mb-2">
                Royalty (basis points — 500 = 5%)
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={form.royalty}
                onChange={e => setForm(f => ({ ...f, royalty: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-input px-4 py-3 font-sans text-[14px] text-ivory focus:outline-none focus:border-gold/40"
              />
            </div>

            {statusMsg && (
              <p className="font-sans text-[13px] text-gold flex items-center gap-2">
                {(step === 'uploading' || step === 'minting') && <Spinner size={14} />}
                {statusMsg}
              </p>
            )}

            <Button
              onClick={() => void handleMint()}
              disabled={!file || !form.name || !form.collectionAddress || step !== 'form' || isPending}
              className="w-full"
              size="lg"
            >
              {step === 'uploading' ? (
                <span className="flex items-center gap-2"><Spinner size={16} /> Uploading...</span>
              ) : step === 'minting' || isPending ? (
                <span className="flex items-center gap-2"><Spinner size={16} /> Minting...</span>
              ) : (
                'Mint NFT'
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
