import { useEffect, useState } from 'react';
import { supabase, Student } from '../lib/supabase';

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [alsStudents, setAlsStudents] = useState<Student[]>([]);
  const [alsPendingStudents, setAlsPendingStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    enrolled: 0,
    pending: 0,
    total: 0,
    stem: 0,
    abm: 0,
    tvlIct: 0,
    humss: 0,
    alsEnrolled: 0,
    alsPending: 0,
  });

  useEffect(() => {
    fetchStudents();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('dashboard_students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'NewStudents' }, () => {
        fetchStudents();
      })
      .subscribe();

    const alsSubscription = supabase
      .channel('dashboard_als_students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ALS' }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      alsSubscription.unsubscribe();
    };
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Fetch enrolled students from NewStudents
      const { data: enrolledData, error: enrolledError } = await supabase
        .from('NewStudents')
        .select('lrn, lname, fname, mname, semester, strand, enrollment_status')
        .eq('enrollment_status', 'Enrolled')
        .order('lrn', { ascending: true });

      if (enrolledError) throw enrolledError;

      // Fetch pending students from NewStudents
      const { data: pendingData, error: pendingError } = await supabase
        .from('NewStudents')
        .select('lrn, lname, fname, mname, semester, strand, enrollment_status')
        .eq('enrollment_status', 'Pending')
        .order('lrn', { ascending: true });

      if (pendingError) throw pendingError;

      // Fetch enrolled ALS students
      const { data: alsEnrolledData, error: alsEnrolledError } = await supabase
        .from('ALS')
        .select('lrn, lname, fname, mname, age, enrollment_status')
        .eq('enrollment_status', 'Enrolled')
        .order('lrn', { ascending: true });

      if (alsEnrolledError) throw alsEnrolledError;

      // Fetch pending ALS students
      const { data: alsPendingData, error: alsPendingError } = await supabase
        .from('ALS')
        .select('lrn, lname, fname, mname, age, enrollment_status')
        .eq('enrollment_status', 'Pending')
        .order('lrn', { ascending: true });

      if (alsPendingError) throw alsPendingError;

      setStudents(enrolledData || []);
      setPendingStudents(pendingData || []);
      setAlsStudents(alsEnrolledData || []);
      setAlsPendingStudents(alsPendingData || []);

      // Calculate strand counts
      const stemCount = enrolledData?.filter(s => s.strand === 'STEM').length || 0;
      const abmCount = enrolledData?.filter(s => s.strand === 'ABM').length || 0;
      const tvlIctCount = enrolledData?.filter(s => s.strand === 'TVL-ICT').length || 0;
      const humssCount = enrolledData?.filter(s => s.strand === 'HUMSS').length || 0;

      setStats({
        enrolled: enrolledData?.length || 0,
        pending: pendingData?.length || 0,
        total: (enrolledData?.length || 0) + (pendingData?.length || 0),
        stem: stemCount,
        abm: abmCount,
        tvlIct: tvlIctCount,
        humss: humssCount,
        alsEnrolled: alsEnrolledData?.length || 0,
        alsPending: alsPendingData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-4xl font-bold text-gray-700">Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg p-6 shadow-md border border-amber-200">
          <p className="text-amber-700 text-xs font-semibold uppercase mb-1">STEM STUDENTS</p>
          <p className="text-5xl font-bold text-gray-800">{stats.stem}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg p-6 shadow-md border border-amber-200">
          <p className="text-amber-700 text-xs font-semibold uppercase mb-1">ABM STUDENTS</p>
          <p className="text-5xl font-bold text-gray-800">{stats.abm}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg p-6 shadow-md border border-amber-200">
          <p className="text-amber-700 text-xs font-semibold uppercase mb-1">TVL-ICT STUDENTS</p>
          <p className="text-5xl font-bold text-gray-800">{stats.tvlIct}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg p-6 shadow-md border border-amber-200">
          <p className="text-amber-700 text-xs font-semibold uppercase mb-1">HUMSS STUDENTS</p>
          <p className="text-5xl font-bold text-gray-800">{stats.humss}</p>
        </div>

        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-6 shadow-md border border-green-200">
          <p className="text-green-700 text-xs font-semibold uppercase mb-1">ALS STUDENTS</p>
          <p className="text-5xl font-bold text-gray-800">{stats.alsEnrolled}</p>
        </div>
      </div>

      <div className="bg-white/80 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-lg font-semibold text-gray-700 uppercase">Enrolled Students:</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No enrolled students yet</div>
        ) : (
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    LRN
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Strand
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/50">
                {students.map((student) => (
                  <tr key={student.lrn} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-800">{student.lrn}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.lname}, {student.fname} {student.mname}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.strand}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.semester}</td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-800">
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

      <div className="mt-8 bg-white/80 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
          <h2 className="text-lg font-semibold text-gray-700 uppercase">Enrolled ALS Students:</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : alsStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No enrolled ALS students yet</div>
        ) : (
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    LRN
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/50">
                {alsStudents.map((student) => (
                  <tr key={student.lrn} className="hover:bg-green-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-800">{student.lrn}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.lname}, {student.fname} {student.mname}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.age}</td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-800">
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

      <div className="mt-8 bg-white/80 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
          <h2 className="text-lg font-semibold text-gray-700 uppercase">Pending Students:</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : pendingStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending students</div>
        ) : (
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-yellow-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    LRN
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Strand
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/50">
                {pendingStudents.map((student) => (
                  <tr key={student.lrn} className="hover:bg-yellow-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-800">{student.lrn}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.lname}, {student.fname} {student.mname}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.strand}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.semester}</td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-800">
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

      <div className="mt-8 bg-white/80 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
          <h2 className="text-lg font-semibold text-gray-700 uppercase">Pending ALS Students:</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : alsPendingStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending ALS students</div>
        ) : (
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-orange-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    LRN
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/50">
                {alsPendingStudents.map((student) => (
                  <tr key={student.lrn} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-800">{student.lrn}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.lname}, {student.fname} {student.mname}</td>
                    <td className="px-6 py-3 text-sm text-gray-800">{student.age}</td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-800">
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

      <div className="mt-8 bg-white/80 rounded-lg shadow-md p-6 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">No. of Enrollment Applications:</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-700">Pending:</span>
            <span className="font-semibold">{stats.pending}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Enrolled:</span>
            <span className="font-semibold">{stats.enrolled}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">ALS Pending:</span>
            <span className="font-semibold">{stats.alsPending}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">ALS Enrolled:</span>
            <span className="font-semibold">{stats.alsEnrolled}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
