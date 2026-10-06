import { Shell } from '@/components/Shell';
import { CreateResearcher } from '@/components/CreateResearcher';
import { serverApi } from '@/lib/server-api';
import type { StudyUser } from '@/lib/types';

type Account = { id: string; email: string; display_name: string | null; created_at: string; disabled_at: string | null };
export default async function AccountsPage() {
  const user = await serverApi<StudyUser>('auth/me');
  const accounts = await serverApi<Account[]>('researcher/accounts');
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Research team</p>
    <h1>Researcher accounts</h1><p>Create a login for your supervisor or another approved study researcher.</p></div></div>
    <CreateResearcher /><section className="card" style={{ marginTop: 16 }}><h2>Current accounts</h2>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Created</th><th>Status</th></tr></thead>
        <tbody>{accounts.map((account) => <tr key={account.id}><td>{account.display_name || '—'}</td>
          <td>{account.email}</td><td>{new Date(account.created_at).toLocaleDateString()}</td>
          <td>{account.disabled_at ? 'Disabled' : 'Active'}</td></tr>)}</tbody></table></div></section></Shell>;
}
