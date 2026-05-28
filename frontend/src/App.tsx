import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import NetworkBanner from '@/components/layout/NetworkBanner';
import Footer from '@/components/layout/Footer';
import Marketplace from '@/pages/Marketplace';


import Collections from '@/pages/Collections';
import CollectionDetail from '@/pages/CollectionDetail';
import Mint from '@/pages/Mint';
import Profile from '@/pages/Profile';
import NFTDetail from '@/pages/NFTDetail';


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
