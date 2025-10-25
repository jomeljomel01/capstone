import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import emailjs from '@emailjs/browser';

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
}

export default function TeacherAccount() {
  const { signOut } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      // Assuming there's a 'teachers' table in Supabase
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Insert teacher record
      const { error: insertError } = await supabase
        .from('teachers')
        .insert([{
          id: authData.user?.id,
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          status: 'Active'
        }]);

      if (insertError) throw insertError;

      // Send welcome email with account details (after Supabase confirmation email)
      const templateParams = {
        to_email: formData.email,
        teacher_name: formData.name,
        teacher_email: formData.email,
        teacher_password: formData.password,
        teacher_subject: formData.subject,
      };

      // Send email after a short delay to ensure Supabase confirmation email is sent first
      setTimeout(async () => {
        try {
          await emailjs.send(
            'service_default', // Default service ID - replace with your actual service ID
            'template_teacher_welcome', // Template ID - replace with your actual template ID
            templateParams,
            'your_public_key_here' // Replace with your actual public key from EmailJS dashboard
          );
          console.log('Welcome email sent successfully to:', formData.email);
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
        }
      }, 2000); // 2 second delay

      // Reset form and refresh list
      setFormData({ name: '', email: '', subject: '', password: '' });
      setShowForm(false);
      fetchTeachers();
    } catch (error: unknown) {
      const err = error as Error;
      setFormError(err.message || 'An error occurred while creating the account');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleDeleteTeacher = async (teacherId: string, teacherEmail: string) => {
    if (!confirm(`Are you sure you want to delete the teacher account for ${teacherEmail}?`)) {
      return;
    }

    try {
      // Delete from teachers table
      const { error: deleteError } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);

      if (deleteError) throw deleteError;

      // Delete from auth.users (optional - this will prevent login)
      // Note: This requires admin privileges in Supabase
      // const { error: authError } = await supabase.auth.admin.deleteUser(teacherId);

      // Refresh the list
      fetchTeachers();
    } catch (error: unknown) {
      const err = error as Error;
      alert(`Error deleting teacher: ${err.message}`);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-700">Teacher Account</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            <span>Create Account</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-8 bg-white/80 rounded-lg shadow-md p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Teacher Account</h2>

          {formError && <p className="text-red-500 mb-4 text-sm">{formError}</p>}

          <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {formLoading ? 'Creating...' : 'Create Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/80 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
          <h2 className="text-lg font-semibold text-gray-700 uppercase">Teachers:</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : teachers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No teachers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/50">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-800">{teacher.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{teacher.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{teacher.subject}</td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-800">
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id, teacher.email)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
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