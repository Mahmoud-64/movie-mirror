export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbGenreListResponse {
  genres: TmdbGenre[];
}

export interface TmdbMovieResult {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  popularity: number;
  genre_ids: number[];
}

export interface TmdbMoviePage {
  page: number;
  results: TmdbMovieResult[];
  total_pages: number;
  total_results: number;
}
