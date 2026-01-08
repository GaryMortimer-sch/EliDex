
import { PokemonDetail, PokemonListItem } from '../types';

const BASE_URL = 'https://pokeapi.co/api/v2';

export const fetchPokemonList = async (limit: number = 151, offset: number = 0): Promise<PokemonListItem[]> => {
  const response = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  const data = await response.json();
  
  const detailedPromises = data.results.map(async (item: { name: string; url: string }) => {
    const detailResponse = await fetch(item.url);
    const detail: PokemonDetail = await detailResponse.json();
    return {
      id: detail.id,
      name: detail.name,
      types: detail.types.map(t => t.type.name),
      image: detail.sprites.other['official-artwork'].front_default,
    };
  });

  return Promise.all(detailedPromises);
};

export const fetchPokemonById = async (idOrName: string | number): Promise<PokemonDetail> => {
  const response = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
  if (!response.ok) throw new Error('Pokemon not found');
  return response.json();
};

export const fetchPokemonSpecies = async (id: number) => {
  const response = await fetch(`${BASE_URL}/pokemon-species/${id}`);
  return response.json();
};
