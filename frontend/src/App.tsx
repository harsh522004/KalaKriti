import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="text-gold p-8 font-serif text-5xl">KalaKriti</div>} />
    </Routes>
  );
}
