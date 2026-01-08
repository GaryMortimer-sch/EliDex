
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PokemonDetail, TYPE_COLORS } from '../types';
import { fetchPokemonById } from '../services/pokeApi';
import TypeBadge from './TypeBadge';

interface PokemonModalProps {
  pokemonId: number;
  onClose: () => void;
}

const PokemonModal: React.FC<PokemonModalProps> = ({ pokemonId, onClose }) => {
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const handlePlayVoice = useCallback(() => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!pokemon) return;

    const typesStr = pokemon.types.map(t => t.type.name).join(' and ');
    const abilitiesStr = pokemon.abilities.map(a => a.ability.name).join(', ');
    const textToSpeak = `${pokemon.name}. This is a ${typesStr} type Pokemon. It stands ${pokemon.height / 10} meters tall and weighs ${pokemon.weight / 10} kilograms. Its abilities include ${abilitiesStr}.`;
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Try to find a nice voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium')));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.pitch = 1;
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isPlaying, pokemon, stopAudio]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchPokemonById(pokemonId);
        setPokemon(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        onClose();
      }
    };
    loadData();

    return () => {
      stopAudio();
    };
  }, [pokemonId, onClose, stopAudio]);

  if (loading || !pokemon) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full flex flex-col items-center shadow-2xl">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Fetching Data...</p>
        </div>
      </div>
    );
  }

  const primaryType = pokemon.types[0].type.name;
  const themeColor = TYPE_COLORS[primaryType] || 'bg-blue-500';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-300 my-auto overflow-hidden">
        {/* Header Background */}
        <div className={`${themeColor} h-48 sm:h-64 flex items-center justify-center relative`}>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors z-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="absolute top-8 left-8 text-white/40 font-black text-6xl sm:text-8xl select-none">
            #{String(pokemon.id).padStart(3, '0')}
          </div>

          <img 
            src={pokemon.sprites.other['official-artwork'].front_default} 
            alt={pokemon.name}
            className="w-48 h-48 sm:w-64 sm:h-64 object-contain drop-shadow-2xl absolute -bottom-12 transform hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="pt-16 pb-10 px-6 sm:px-12">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-4xl font-bold text-slate-800 capitalize">{pokemon.name}</h2>
              <button 
                onClick={handlePlayVoice}
                className={`p-2 rounded-full transition-all ${
                  isPlaying 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Listen to Pokedex entry"
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex gap-2">
              {pokemon.types.map(t => (
                <TypeBadge key={t.type.name} type={t.type.name} size="lg" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stats */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Base Stats
              </h3>
              <div className="space-y-4">
                {pokemon.stats.map(s => (
                  <div key={s.stat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500 font-medium capitalize">{s.stat.name.replace('-', ' ')}</span>
                      <span className="text-slate-800 font-bold">{s.base_stat}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full ${themeColor} transition-all duration-1000`} 
                        style={{ width: `${Math.min((s.base_stat / 255) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Physical Traits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Weight</span>
                    <span className="text-lg font-bold text-slate-700">{pokemon.weight / 10} kg</span>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Height</span>
                    <span className="text-lg font-bold text-slate-700">{pokemon.height / 10} m</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  Abilities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pokemon.abilities.map(a => (
                    <span 
                      key={a.ability.name}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize border shadow-sm ${
                        a.is_hidden ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {a.ability.name.replace('-', ' ')}
                      {a.is_hidden && <span className="ml-1 text-[10px] opacity-70">(Hidden)</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonModal;
