import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import NetworkBanner from '@/components/layout/NetworkBanner';
import Footer from '@/components/layout/Footer';
import Marketplace from '@/pages/Marketplace';


import Collections from '@/pages/Collections';
import CollectionDetail from '@/pages/CollectionDetail';
const Mint            = () => <div className="p-8 text-gold font-serif text-4xl">Mint</div>;
const Profile         = () => <div className="p-8 text-gold font-serif text-4xl">Profile</div>;
const NFTDetail       = () => <div className="p-8 text-gold font-serif text-4xl">NFT Detail</div>;


export default function App() {
  return (
    <div className="bg-bg min-h-screen">
      <Navbar />
      <NetworkBanner />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"                         element={<Marketplace />} />
          <Route path="/collections"              element={<Collections />} />
          <Route path="/collections/:address"     element={<CollectionDetail />} />
          <Route path="/mint"                     element={<Mint />} />
          <Route path="/profile"                  element={<Profile />} />
          <Route path="/nft/:collection/:tokenId" element={<NFTDetail />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
