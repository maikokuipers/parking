/**
 * Server-side Egis Parking API client.
 * All methods use the token manager for authentication.
 *
 * The SSP login token only has access to /v1/ssp/* endpoints.
 * Front-office endpoints like /v1/account or /v1/permit/list require DigiD auth.
 */

import { getToken, clearToken } from "./token-manager";

const BASE_URL =
  process.env.EGIS_API_BASE_URL ||
  "https://api.parkeervergunningen.egisparkingservices.nl/api";
const V1_URL = `${BASE_URL}/v1`;

async function egisRequest<T>(
  url: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = await getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401 && retry) {
    // Token may be expired, clear and retry once
    clearToken();
    return egisRequest(url, options, false);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Egis API error (${response.status}): ${text}`);
  }

  return response.json();
}

// ============================================
// Parking Zones
// ============================================

export async function getParkingZones(
  clientProductId: number
): Promise<{
  count: number;
  paid_parking_zones: Array<{
    zone_id: number;
    zone_description: string;
    time_frame_data: Array<Array<{ startTime: string; endTime: string }>>;
  }>;
}> {
  return egisRequest(
    `${V1_URL}/ssp/paid_parking_zone/list/client_product/${clientProductId}`
  );
}

// ============================================
// Parking Sessions
// ============================================

export async function startParkingSession(data: {
  client_product_id: number;
  vrn: string;
  started_at: string;
  ended_at: string;
  zone_id: number;
}): Promise<{ parking_session_id: number }> {
  return egisRequest(`${V1_URL}/ssp/parking_session/start`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function calculateCost(data: {
  client_product_id: number;
  vrn: string;
  started_at: string;
  ended_at: string;
  paid_parking_zone_id: number;
}): Promise<{
  parking_session_balance: {
    calculated_cost: number;
    duration: number;
    calculated_time: number;
  };
}> {
  return egisRequest(`${V1_URL}/ssp/parking_session/cost_calculator`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editParkingSession(
  sessionId: number,
  data: { new_ended_at: string }
): Promise<{ id: number; ended_at: string; status: string }> {
  return egisRequest(`${V1_URL}/ssp/parking_session/${sessionId}/edit`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function listParkingSessions(params: {
  page?: number;
  row_per_page?: number;
  product_id?: number;
  sort?: string;
  filters?: string;
}): Promise<{
  count: number;
  page: number;
  row_per_page: number;
  data: Array<{
    parking_session_id: number;
    client_product_id: number;
    vrn: string;
    started_at: string;
    ended_at: string;
    status: string;
    cost: number;
    zone_description: string;
    permit_name: string;
    machine_number: number;
    can_edit: boolean;
  }>;
}> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.row_per_page)
    searchParams.set("row_per_page", String(params.row_per_page));
  if (params.product_id)
    searchParams.set("product_id", String(params.product_id));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.filters) searchParams.set("filters", params.filters);

  const query = searchParams.toString();
  return egisRequest(
    `${V1_URL}/ssp/parking_session/list${query ? `?${query}` : ""}`
  );
}

// ============================================
// Favorite License Plates (Egis-side)
// ============================================

export async function getFavoriteVrns(): Promise<{
  count: number;
  favorite_vrns: Array<{
    id: number;
    vrn: string;
    description: string;
    created_at: string;
  }>;
}> {
  return egisRequest(`${V1_URL}/ssp/favorite_vrn/list`);
}

export async function addFavoriteVrn(data: {
  vrn: string;
  description: string;
}): Promise<unknown> {
  return egisRequest(`${V1_URL}/ssp/favorite_vrn/add`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteFavoriteVrn(id: number): Promise<unknown> {
  return egisRequest(`${V1_URL}/ssp/favorite_vrn/${id}/delete`, {
    method: "DELETE",
  });
}
