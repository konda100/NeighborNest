import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nn_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Types ----------------------------------------------------------------

export interface NeighborhoodSummary {
  id: string;
  name: string;
  slug: string;
  zip?: string | null;
  homeCount: number;
  description?: string | null;
  city: string;
  county: string;
  state: string;
  stateCode: string;
  path: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  streetAddress?: string | null;
  neighborhoodId?: string | null;
  neighborhood?: {
    id: string;
    name: string;
    slug: string;
    city: { name: string; county: { name: string; state: { name: string; code: string } } };
  } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
}

export interface ProviderStats {
  neighborCount: number;
  recommendationCount: number;
  avgRating: number | null;
  recommendRate: number | null;
}

export interface Provider {
  id: string;
  name: string;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  description?: string | null;
  serviceArea?: string | null;
  verified: boolean;
  categories: Category[];
  stats: ProviderStats;
}

export interface Recommendation {
  id: string;
  rating: number;
  recommend: boolean;
  timesUsed?: string | null;
  pricePaid?: string | null;
  comment?: string | null;
  groupInterest: boolean;
  groupTargetDate?: string | null;
  author: string;
  authorId: string;
  category: { name: string; slug: string };
  neighborhood: string;
  createdAt: string;
}

export interface ProviderDetail extends Provider {
  scopedStats: ProviderStats;
  recommendations: Recommendation[];
}

export interface Deal {
  id: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  minHomes: number;
  soloPrice?: number | null;
  groupPrice?: number | null;
  status: string;
  category: { name: string; slug: string; icon?: string | null } | null;
  neighborhood: { id: string; name: string } | null;
  organizer: { id: string; name: string } | null;
  provider: { id: string; name: string } | null;
  committedHomes: number;
  progress: number;
  criticalMassReached: boolean;
  savingsPerHome: number | null;
  totalCommunitySavings: number | null;
  committedBy: { id: string; name: string }[];
  iCommitted: boolean;
  createdAt: string;
}

export interface AskReply {
  id: string;
  body: string;
  author: { id: string; name: string };
  createdAt: string;
}

export interface AskPost {
  id: string;
  title: string;
  body?: string | null;
  author: { id: string; name: string };
  neighborhood: { id: string; name: string };
  replies: AskReply[];
  createdAt: string;
}

export interface NeighborhoodStats {
  residents: number;
  homeCount: number;
  providers: number;
  recommendations: number;
  askPosts: number;
  activeDeals: number;
  totalDeals: number;
  realizedSavings: number;
}
