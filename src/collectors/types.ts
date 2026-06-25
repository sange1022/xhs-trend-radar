import type { NormalizedNote } from "../shared/types";

export interface Collector {
  name: string;
  collect(keyword: string, limit: number): Promise<NormalizedNote[]>;
}
