import { useEffect, useState } from 'react';
import { supabase, Student } from '../lib/supabase';
import { Search } from 'lucide-react';

export default function ALSNewEnrollees() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortGradeLevel, setSortGradeLevel] = useState('');

  const filteredStudents = students.filter((student) => {
    const matchesSearch = searchTerm === '' ||
      student.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.lrn && student.lrn.toString().includes(searchTerm));

    const matchesGradeLevel = sortGradeLevel === '' || student.gradeLevel === sortGradeLevel;

    return matchesSearch && matchesGradeLevel;
  });

  useEffect(() => {
    fetchALSNewEnrollees();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('als_new_enrollees')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ALS' }, () => {
        fetchALSNewEnrollees();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchALSNewEnrollees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ALS')
        .select('*')
        .eq('enrollment_status', 'Pending');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching ALS new enrollees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (studentLrn: string | undefined) => {
    if (!studentLrn) return;
    if (!confirm('Are you sure you want to enroll this student?')) return;

    try {
      const { error } = await supabase
        .from('ALS')
        .update({ enrollment_status: 'Enrolled' })
        .eq('lrn', studentLrn);

      if (error) throw error;

      setStudents(students.filter((s) => s.lrn !== studentLrn));
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert('Failed to enroll student');
    }
  };

  const handleDelete = async (studentLrn: string | undefined) => {
    if (!studentLrn) return;
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabase
        .from('ALS')
        .delete()
        .eq('lrn', studentLrn);

      if (error) throw error;

      setStudents(students.filter((s) => s.lrn !== studentLrn));
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };


  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-700">ALS New Enrollees</h1>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
          Search
        </button>
      </div>

      <div className="bg-white/80 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3">
            List of All ALS New Enrollees:
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">SORT BY:</span>
            <select
              value={sortGradeLevel}
              onChange={(e) => setSortGradeLevel(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">GRADE LEVEL</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No ALS new enrollees found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">LRN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Age</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">GradeLevel</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/50">
                {filteredStudents.map((student) => (
                  <tr key={student.lrn} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEnroll(student.lrn)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          Enroll
                        </button>
                        <button
                          onClick={() => handleDelete(student.lrn)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.lrn || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.lname}, {student.fname} {student.mname}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.age}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.gradeLevel}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.enrollment_status}</td>
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