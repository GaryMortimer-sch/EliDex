
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
  // First attempt: direct pokemon endpoint
  try {
    const response = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn(`Direct fetch for ${idOrName} failed, trying species fallback...`);
  }

  // Fallback for names that PokeAPI treats as species only or have form prefixes (e.g., wishiwashi)
  // We try to fetch the species, then use its id to get the default pokemon form.
  if (typeof idOrName === 'string') {
    try {
      const speciesResponse = await fetch(`${BASE_URL}/pokemon-species/${idOrName.toLowerCase().trim()}`);
      if (speciesResponse.ok) {
        const speciesData = await speciesResponse.json();
        const pokemonId = speciesData.id;
        const finalResponse = await fetch(`${BASE_URL}/pokemon/${pokemonId}`);
        if (finalResponse.ok) {
          return await finalResponse.json();
        }
      }
    } catch (e) {
      console.error(`Species fallback for ${idOrName} also failed.`);
    }
  }

  throw new Error(`Pokemon ${idOrName} not found in database.`);
};

export const fetchPokemonSpecies = async (id: number) => {
  const response = await fetch(`${BASE_URL}/pokemon-species/${id}`);
  return response.json();
};
