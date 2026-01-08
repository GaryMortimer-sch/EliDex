
import React, { useState, useEffect, useMemo } from 'react';
import { fetchPokemonList, fetchPokemonById } from './services/pokeApi';
import { PokemonListItem, TYPE_COLORS } from './types';
import PokemonCard from './components/PokemonCard';
import PokemonModal from './components/PokemonModal';
import CameraScanner from './components/CameraScanner';

const App: React.FC = () => {
  const [allPokemon, setAllPokemon] = useState<PokemonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const data = await fetchPokemonList(151);
        setAllPokemon(data);
      } catch (error) {
        console.error("Failed to fetch pokemon list", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const filteredPokemon = useMemo(() => {
    return allPokemon.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toString() === searchQuery;
      const matchesType = !selectedType || p.types.includes(selectedType.toLowerCase());
      return matchesSearch && matchesType;
    });
  }, [allPokemon, searchQuery, selectedType]);

  const handleIdentified = async (name: string) => {
    try {
      const pokemon = await fetchPokemonById(name.toLowerCase());
      setSelectedPokemonId(pokemon.id);
      setIsScannerOpen(false);
    } catch (err) {
      console.log(`Scanner found text "${name}" but it's not a valid Pokemon.`);
    }
  };

  const handleCloseModal = () => {
    setSelectedPokemonId(null);
  };

  const pokemonTypes = Object.keys(TYPE_COLORS);

  return (
    <div className="min-h-screen pb-20 selection:bg-red-100 selection:text-red-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Eli<span className="text-red-600">Dex</span></h1>
                <p className="text-slate-500 text-sm font-medium">Vision & Voice Enabled</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl lg:ml-12">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search by name or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-red-500 transition-all font-medium text-slate-700 shadow-inner"
                />
              </div>
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="bg-slate-800 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Vision Scanner
              </button>
            </div>
          </div>

          {/* Type Filter Chips */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                !selectedType 
                  ? 'bg-slate-800 text-white shadow-lg' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Types
            </button>
            {pokemonTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap capitalize transition-all border border-transparent ${
                  selectedType === type 
                    ? `${TYPE_COLORS[type]} text-white shadow-lg scale-105` 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="bg-slate-200 h-64 rounded-2xl animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : filteredPokemon.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredPokemon.map(p => (
              <PokemonCard 
                key={p.id} 
                pokemon={p} 
                onClick={(id) => setSelectedPokemonId(id)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">No Pokemon Found</h3>
            <p className="text-slate-500 mt-2">Try searching by ID (e.g., "25") or changing filters.</p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedPokemonId && (
        <PokemonModal 
          pokemonId={selectedPokemonId} 
          onClose={handleCloseModal}
        />
      )}

      {/* Scanner */}
      {isScannerOpen && (
        <CameraScanner 
          onClose={() => setIsScannerOpen(false)} 
          onIdentified={handleIdentified}
        />
      )}

      {/* Footer */}
      <footer className="text-center text-slate-400 text-sm mt-12 py-8 border-t border-slate-100">
        <p>© 2025 EliDex. Powered by PokeAPI & Open Source Vision.</p>
      </footer>
    </div>
  );
};

export default App;
