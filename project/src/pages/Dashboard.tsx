import { useEffect, useState } from 'react';
import { supabase, Student } from '../lib/supabase';
import { Users, UserCheck, Clock } from 'lucide-react';

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolled: 0,
    pending: 0,
    total: 0,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('NewStudent')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrolledStudents = data?.filter(s => s.enrollment_status === 'Enrolled') || [];
      setStudents(enrolledStudents);

      const pendingCount = data?.filter(s => s.enrollment_status === 'Pending').length || 0;
      const enrolledCount = enrolledStudents.length;

      setStats({
        enrolled: enrolledCount,
        pending: pendingCount,
        total: data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of student enrollment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Enrolled Students</p>
              <p className="text-4xl font-bold mt-2">{stats.enrolled}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <UserCheck size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Pending Approval</p>
              <p className="text-4xl font-bold mt-2">{stats.pending}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Clock size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Students</p>
              <p className="text-4xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Users size={32} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Enrolled Students</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No enrolled students yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    First Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Middle Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Strand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Year Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">{student.lname}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{student.fname}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{student.mname}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{student.strand}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{student.semester}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{student.yearlevel}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {student.enrollment_status}
                      </span>
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
