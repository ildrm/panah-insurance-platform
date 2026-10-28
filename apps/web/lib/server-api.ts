import { cookies } from 'next/headers';
import { ApiClient } from '@st/api-client';
export async function serverApi(): Promise<ApiClient> { const store = await cookies(); return new ApiClient(process.env.API_ORIGIN ?? 'http://127.0.0.1:3001', store.toString()); }
