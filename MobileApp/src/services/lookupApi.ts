import axios from "axios";
import { LOOKUP_BASE } from "../config";

// Plain, unauthenticated client — the Lookup Service holds no citizen
// data, just the routing registry, so no bearer token is needed here.
const lookupClient = axios.create({ baseURL: LOOKUP_BASE, timeout: 15000 });

export type RepType = "MLA" | "MP" | "COUNCILLOR";

export interface ConstituencyOption {
  label: string;
  rep_name: string;
  assembly_name?: string;
  parliamentary_name?: string;
  ward_id?: string;
  ward_name?: string;
  district?: string;
  state?: string;
}

export interface ResolvedRepresentative {
  rep_code: string;
  slug: string;
  name: string;
  rep_type: RepType;
  server_url: string;
  assembly_name: string;
  parliamentary_name: string;
  ward_id: string;
  ward_name: string;
  taluk: string;
  district: string;
  state: string;
  status: string;
}

/** Populates the "choose your Councillor / MLA / MP" dropdown. */
export async function fetchConstituencies(repType: RepType): Promise<ConstituencyOption[]> {
  const { data } = await lookupClient.get("/api/lookup/constituencies", {
    params: { rep_type: repType },
  });
  const body = data?.data ?? data;
  return body?.items ?? [];
}

/**
 * Given the constituency the citizen picked, returns that representative's
 * OWN server_url. Everything after this call (send-otp, verify-otp,
 * profile, grievances, ...) goes straight to that server, not here.
 */
export async function resolveRepresentative(
  repType: RepType,
  identifier: { assemblyName?: string; parliamentaryName?: string; wardId?: string }
): Promise<ResolvedRepresentative> {
  const params: Record<string, string> = { rep_type: repType };
  if (repType === "MLA" && identifier.assemblyName) params.assembly_name = identifier.assemblyName;
  if (repType === "MP" && identifier.parliamentaryName) params.parliamentary_name = identifier.parliamentaryName;
  if (repType === "COUNCILLOR" && identifier.wardId) params.ward_id = identifier.wardId;

  const { data } = await lookupClient.get("/api/lookup/resolve", { params });
  return (data?.data ?? data) as ResolvedRepresentative;
}
