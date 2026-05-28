export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full border-2 border-gold/20 border-t-gold animate-spin"
    />
  );
}
