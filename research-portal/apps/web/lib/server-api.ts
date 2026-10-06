import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function serverApi<T>(path: string): Promise<T> {
  const token = (await cookies()).get('study_sid')?.value;
  if (!token) redirect('/login');
  const response = await fetch(`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000'}/${path}`, {
    headers: { authorization: `Bearer ${token}` }, cache: 'no-store'
  });
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error(`Portal API error (${response.status})`);
  return response.json() as Promise<T>;
}
