
const getApiKey = () => {
  try {
    // Check for Vite-exposed key first, then fallback to provided default
    // @ts-ignore
    return process.env.VITE_OMDB_API_KEY || process.env.OMDB_API_KEY || 'eaad6489';
  } catch (e) {
    return 'eaad6489'; 
  }
};

export interface OMDBMetadata {
  poster: string | null;
  rating: string | null;
}

export const fetchOMDBMetadata = async (title: string, year: number): Promise<OMDBMetadata | null> => {
  const API_KEY = getApiKey();
  try {
    const response = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&y=${year}&apikey=${API_KEY}`
    );
    const data = await response.json();
    
    if (data.Response === 'True') {
      return {
        poster: data.Poster !== 'N/A' ? data.Poster : null,
        rating: data.imdbRating !== 'N/A' ? data.imdbRating : 'N/A'
      };
    }
    return null;
  } catch (error) {
    console.error("OMDB Fetch Error:", error);
    return null;
  }
};
