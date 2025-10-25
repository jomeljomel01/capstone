import { useEffect, useState } from 'react';
import { supabase, Student } from '../lib/supabase';
import { CheckCircle, Clock, Trash2 } from 'lucide-react';

export default function NewStudent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('NewStudent')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: number | undefined) => {
    if (!studentId) return;

    try {
      setProcessing(studentId);
      const { error } = await supabase
        .from('NewStudent')
        .update({ enrollment_status: 'Enrolled' })
        .eq('id', studentId);

      if (error) throw error;

      setStudents(students.filter((s) => s.id !== studentId));
    } catch (error) {
      console.error('Error approving student:', error);
      alert('Failed to approve student');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (studentId: number | undefined) => {
    if (!studentId) return;
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      setProcessing(studentId);
      const { error } = await supabase
        .from('NewStudent')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      setStudents(students.filter((s) => s.id !== studentId));
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">New Student Applications</h1>
        <p className="text-slate-600 mt-1">Review and approve pending enrollments</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <Clock className="text-amber-600" size={20} />
            <h2 className="text-xl font-semibold text-slate-900">
              All Students ({students.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No students found</div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
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
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                        {student.enrollment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(student.id)}
                          disabled={processing === student.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={processing === student.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
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
