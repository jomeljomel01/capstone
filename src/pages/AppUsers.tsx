import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, CheckCircle, Plus } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface AppUser {
  email: string;
  password: string;
  status: string;
  full_name: string;
}

export default function AppUsers() {
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: ''
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
  });

  useEffect(() => {
    fetchAppUsers();
  }, []);

  const fetchAppUsers = async () => {
    try {
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
    }
  };




  const handleApproveAppUser = async (userEmail: string) => {
    if (!confirm(`Are you sure you want to approve the app user account for ${userEmail}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('AppUsers')
        .update({ status: 'Approved' })
        .eq('email', userEmail);

      if (error) throw error;

      // Send approval email
      const templateParams = {
        email: userEmail,
        user_email: userEmail,
      };

      console.log('Sending approval email with params:', templateParams);

      // Check if all required values are present
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID ||
          !import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
          !import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
        throw new Error('EmailJS configuration is missing. Please check your .env file.');
      }

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        'template_yy2u2nl', // Approval template
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      console.log('Approval email sent successfully to:', userEmail);

      console.log('Approval email sent successfully');

      // Refresh the list
      fetchAppUsers();
      alert('App user approved and notification email sent!');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error approving app user:', err);
      alert(`Error approving app user: ${err.message}`);
    }
  };


  const handleDeleteAppUser = async (userEmail: string) => {
    if (!confirm(`Are you sure you want to delete the app user account for ${userEmail}?`)) {
      return;
    }

    try {
      // Delete from AppUsers table
      const { error: deleteError } = await supabase
        .from('AppUsers')
        .delete()
        .eq('email', userEmail);

      if (deleteError) throw deleteError;

      // Delete from auth.users (optional - this will prevent login)
      // Note: This requires admin privileges in Supabase
      // const { error: authError } = await supabase.auth.admin.deleteUser(userEmail);

      // Refresh the list
      fetchAppUsers();
    } catch (error: unknown) {
      const err = error as Error;
      alert(`Error deleting app user: ${err.message}`);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.email || !newUser.full_name || !newUser.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('AppUsers')
        .insert({
          email: newUser.email,
          full_name: newUser.full_name,
          password: newUser.password,
          status: 'Approved' // Default to approved for manually added accounts
        });

      if (error) throw error;

      // Send account activation email with credentials
      const templateParams = {
        email: newUser.email,
        user_email: newUser.email,
        user_password: newUser.password,
      };

      console.log('Sending account activation email with params:', templateParams);
      console.log('EmailJS Config:', {
        serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
        templateId: 'template_yy2u2nl',
        publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      });

      // Check if all required values are present
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID ||
          !import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
          !import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
        throw new Error('EmailJS configuration is missing. Please check your .env file.');
      }

      try {
        const result = await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          'template_yy2u2nl', // Account activation template
          templateParams,
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
        console.log('EmailJS result:', result);
        console.log('Account activation email sent successfully to:', newUser.email);
      } catch (emailError) {
        console.error('EmailJS error:', emailError);
        throw emailError;
      }

      alert('App user added successfully and activation email sent!');
      setShowAddModal(false);
      setNewUser({ email: '', full_name: '', password: '' });
      fetchAppUsers();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error adding app user:', err);
      alert(`Error adding app user: ${err.message}`);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-[450px] bg-gradient-to-br from-blue-500 to-blue-50"></div>
        <div className="w-full h-full bg-gray-100 -mt-[2px]"></div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen ml-68 overflow-y-auto">
        <div className="p-4 pl-32 pt-12">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">App Users</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg text-lg font-medium hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 h-40 rounded-xl shadow-md flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-600 uppercase">PENDING USERS</p>
                <p className="text-4xl font-semibold text-gray-600 mt-2">{stats.pending}</p>
              </div>
              <div className="bg-gradient-to-tr from-yellow-400 to-yellow-600 p-4 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>

            <div className="bg-white p-6 h-40 rounded-xl shadow-md flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-600 uppercase">APPROVED USERS</p>
                <p className="text-4xl font-semibold text-gray-600 mt-2">{stats.approved}</p>
              </div>
              <div className="bg-gradient-to-tr from-green-400 to-green-600 p-4 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md flex-grow">
            <div className="border-b-2 border-gray-300 pb-2 mb-4">
              <h2 className="text-lg font-bold text-gray-600">LIST OF ALL APP USERS:</h2>
            </div>
            <div className="overflow-x-auto">
              {appUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No app users found</div>
              ) : (
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3 px-6">Email</th>
                      <th scope="col" className="py-3 px-6">Full Name</th>
                      <th scope="col" className="py-3 px-6">Status</th>
                      <th scope="col" className="py-3 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appUsers.map((user) => (
                      <tr key={user.email} className="bg-white border-b">
                        <td className="py-3 px-6">{user.email}</td>
                        <td className="py-3 px-6">{user.full_name}</td>
                        <td className="py-3 px-6">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                            user.status === 'Approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDeleteAppUser(user.email)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                            {user.status === 'Pending' && (
                              <button
                                onClick={() => handleApproveAppUser(user.email)}
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Add New Account</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="full_name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                  >
                    Add Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}