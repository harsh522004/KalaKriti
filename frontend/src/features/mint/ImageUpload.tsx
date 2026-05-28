import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface Props {
  onFile: (file: File) => void;
  preview?: string;
}

export default function ImageUpload({ onFile, preview }: Props) {
  const [dragging, setDragging] = useState(false);

  const handle = useCallback((file: File) => {
    if (file.type.startsWith('image/')) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handle(f);
      }}
      className={`relative border-2 border-dashed rounded-nft aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors duration-fast ${
        dragging ? 'border-gold bg-gold/5' : 'border-white/20 hover:border-gold/40 bg-surface'
      }`}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-nft" />
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted">
          <UploadCloud size={40} className="text-gold/40" />
          <p className="font-sans text-[14px]">Drop image here or click to upload</p>
          <p className="font-sans text-[12px]">PNG, JPG, GIF, WEBP — max 10MB</p>
        </div>
      )}
      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
    </div>
  );
}
