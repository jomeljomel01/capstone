import { useEffect, useState } from 'react';
import { supabase, Student } from '../lib/supabase';
import { BookOpen, Edit, Trash2 } from 'lucide-react';

export default function ALSStudent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Student | null>(null);

  useEffect(() => {
    fetchALSStudents();
  }, []);

  const fetchALSStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('NewStudent')
        .select('*')
        .eq('strand', 'ALS')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching ALS students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id || null);
    setEditForm(student);
  };

  const handleUpdate = async () => {
    if (!editForm || !editingId) return;

    try {
      const { error } = await supabase
        .from('NewStudent')
        .update({
          lname: editForm.lname,
          fname: editForm.fname,
          mname: editForm.mname,
          semester: editForm.semester,
          yearlevel: editForm.yearlevel,
          enrollment_status: editForm.enrollment_status,
        })
        .eq('id', editingId);

      if (error) throw error;

      setStudents(
        students.map((s) => (s.id === editingId ? { ...s, ...editForm } : s))
      );
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student');
    }
  };

  const handleDelete = async (studentId: number | undefined) => {
    if (!studentId) return;
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabase
        .from('NewStudent')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      setStudents(students.filter((s) => s.id !== studentId));
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ALS Students</h1>
            <p className="text-slate-600 mt-1">Alternative Learning System enrollees</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Total ALS Students: {students.length}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No ALS students found</div>
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
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {editingId === student.id ? (
                        <input
                          type="text"
                          value={editForm?.lname || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, lname: e.target.value })
                          }
                          className="border border-slate-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        student.lname
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {editingId === student.id ? (
                        <input
                          type="text"
                          value={editForm?.fname || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, fname: e.target.value })
                          }
                          className="border border-slate-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        student.fname
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {editingId === student.id ? (
                        <input
                          type="text"
                          value={editForm?.mname || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, mname: e.target.value })
                          }
                          className="border border-slate-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        student.mname
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {editingId === student.id ? (
                        <input
                          type="text"
                          value={editForm?.semester || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, semester: e.target.value })
                          }
                          className="border border-slate-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        student.semester
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {editingId === student.id ? (
                        <input
                          type="text"
                          value={editForm?.yearlevel || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, yearlevel: e.target.value })
                          }
                          className="border border-slate-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        student.yearlevel
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === student.id ? (
                        <select
                          value={editForm?.enrollment_status || ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm!,
                              enrollment_status: e.target.value as 'Pending' | 'Enrolled',
                            })
                          }
                          className="border border-slate-300 rounded px-2 py-1"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Enrolled">Enrolled</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            student.enrollment_status === 'Enrolled'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {student.enrollment_status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {editingId === student.id ? (
                          <>
                            <button
                              onClick={handleUpdate}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditForm(null);
                              }}
                              className="px-3 py-1.5 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(student)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </>
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
