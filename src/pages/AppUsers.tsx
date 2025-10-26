import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, CheckCircle } from 'lucide-react';

interface AppUser {
  id: string;
  email: string;
  password: string;
  status: string;
  full_name: string;
}

export default function AppUsers() {
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
  });

  useEffect(() => {
    fetchAppUsers();
  }, []);

  const fetchAppUsers = async () => {
    try {
      setLoading(true);
      // Assuming there's a 'AppUsers' table in Supabase
      const { data, error } = await supabase
        .from('AppUsers')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setAppUsers(data || []);

      // Calculate stats
      const pendingCount = data?.filter(user => user.status === 'Pending').length || 0;
      const approvedCount = data?.filter(user => user.status === 'Approved').length || 0;

      setStats({
        pending: pendingCount,
        approved: approvedCount,
      });
    } catch (error) {
      console.error('Error fetching app users:', error);
    } finally {
      setLoading(false);
    }
  };




  const handleApproveAppUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to approve the app user account for ${userEmail}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('AppUsers')
        .update({ status: 'Approved' })
        .eq('id', userId);

      if (error) throw error;

      // Refresh the list
      fetchAppUsers();
    } catch (error: unknown) {
      const err = error as Error;
      alert(`Error approving app user: ${err.message}`);
    }
  };


  const handleDeleteAppUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete the app user account for ${userEmail}?`)) {
      return;
    }

    try {
      // Delete from AppUsers table
      const { error: deleteError } = await supabase
        .from('AppUsers')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      // Delete from auth.users (optional - this will prevent login)
      // Note: This requires admin privileges in Supabase
      // const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      // Refresh the list
      fetchAppUsers();
    } catch (error: unknown) {
      const err = error as Error;
      alert(`Error deleting app user: ${err.message}`);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-700">Mobile Application Users</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg p-6 shadow-md border border-yellow-200">
          <p className="text-yellow-700 text-xs font-semibold uppercase mb-1">PENDING USERS</p>
          <p className="text-5xl font-bold text-gray-800">{stats.pending}</p>
        </div>

        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-6 shadow-md border border-green-200">
          <p className="text-green-700 text-xs font-semibold uppercase mb-1">APPROVED USERS</p>
          <p className="text-5xl font-bold text-gray-800">{stats.approved}</p>
        </div>
      </div>


      <div className="bg-white/80 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
          <h2 className="text-lg font-semibold text-gray-700 uppercase">AppUsers</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : appUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No app users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Password
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/50">
                {appUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-800">{user.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{user.password}</td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-800">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-800">{user.full_name}</td>
                    <td className="px-6 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteAppUser(user.id, user.email)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                        {user.status === 'Pending' && (
                          <button
                            onClick={() => handleApproveAppUser(user.id, user.email)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            <CheckCircle size={14} />
                            <span>Approve</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}