export interface RawCountry {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  area?: number;
  borders?: string[];
  languages?: Array<{ name: string }>;
  currencies?: Array<{ name: string; symbol?: string }>;
  description?: string;
}

export interface Country {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  area?: number;
  borders?: string[];
  languages?: string[];
  currency?: string;
  description?: string;
}
