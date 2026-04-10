export interface GapRow {
  cipCode: string;
  cipTitle: string;
  socCode: string;
  socTitle: string;
  totalCompletions: number;
  avgEmployment: number;
  avgWage: number;
  completionsGrowth: number;
  employmentGrowth: number;
  gapScore: number;
  weightedGapScore: number; // gapScore × (avgWage / 90000)
  demandScore: number;      // employmentGrowth × avgEmployment / 100000
}

export interface ScoringRow {
  cipCode: string;
  cipTitle: string;
  socCode: string;
  socTitle: string;
  avgWage: number;
  gapScore: number;
  weightedGapScore: number;
  demandScore: number;
  opportunityScore: number; // composite 0–100
  wgapComponent: number;
  wageComponent: number;
  demandComponent: number;
}

export interface Institution {
  id: string;
  name: string;
  city: string;
  state: string;
  instType: string;
}

export interface BenchmarkRow {
  cipCode: string;
  cipTitle: string;
  institutionCompletions: number;
  stateAvgCompletions: number;
  peerAvgCompletions: number;
}

export interface BenchmarkData {
  institution: Institution;
  peers: Institution[];
  rows: BenchmarkRow[];
}

export interface OccupationRow {
  socCode: string;
  socTitle: string;
  employment: number;
  meanWage: number;
  growthRate: number;
}

export interface CompletionTrend {
  cipTitle: string;
  year: number;
  completions: number;
}

export interface DashboardStats {
  totalCompletions: number;
  totalOccupations: number;
  avgWage: number;
  gapCount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  gapAnalysis: GapRow[];
  topOccupations: OccupationRow[];
  completionTrends: CompletionTrend[];
  scoring: ScoringRow[];
}

export interface FilterOptions {
  states: string[];
  years: number[];
  instTypes: string[];
  institutions: Institution[];
}

export interface DashboardFilters {
  state?: string;
  instType?: string;
  yearStart?: number;
  yearEnd?: number;
}
