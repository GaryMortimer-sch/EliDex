
import React from 'react';
import { PokemonListItem } from '../types';
import TypeBadge from './TypeBadge';

interface PokemonCardProps {
  pokemon: PokemonListItem;
  onClick: (id: number) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onClick }) => {
  const formattedId = `#${String(pokemon.id).padStart(3, '0')}`;

  return (
    <div 
      onClick={() => onClick(pokemon.id)}
      className="bg-white rounded-2xl p-5 poke-card-shadow poke-card-hover transition-all duration-300 cursor-pointer flex flex-col items-center group relative overflow-hidden"
    >
      <div className="absolute top-4 right-4 text-slate-200 font-bold text-xl group-hover:text-slate-300 transition-colors">
        {formattedId}
      </div>
      
      <div className="w-32 h-32 mb-4 relative z-10 flex items-center justify-center">
        <img 
          src={pokemon.image} 
          alt={pokemon.name}
          className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute -z-10 w-24 h-24 bg-slate-100 rounded-full blur-2xl group-hover:bg-slate-200 transition-colors"></div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 capitalize mb-3 group-hover:text-blue-600 transition-colors">
        {pokemon.name}
      </h3>

      <div className="flex gap-2">
        {pokemon.types.map(type => (
          <TypeBadge key={type} type={type} size="sm" />
        ))}
      </div>
    </div>
  );
};

export default PokemonCard;
