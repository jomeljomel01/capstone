import { useEffect, useState } from 'react';
import { supabase, Student } from '../lib/supabase';
import { Search } from 'lucide-react';

export default function RegularStudent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortStrand, setSortStrand] = useState('');
  const [sortGradeLevel, setSortGradeLevel] = useState('');
  const [sortSemester, setSortSemester] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchRegularStudents();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('regular_students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'NewStudents' }, () => {
        fetchRegularStudents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRegularStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('NewStudents')
        .select('lrn, schoolYear, gradeLevel, psa, lname, fname, mname, bday, age, sex, birthplace, religion, motherTongue, indigenousPeople, fourPS, houseNumber, streetName, barangay, municipality, province, country, zipCode, pHN, pSN, pbrgy, pMunicipal, pProvince, pCountry, pZipCode, fatherFN, fatherMN, fatherLN, fatherCN, motherFN, motherMN, motherLN, motherCN, guardianFN, guardianLN, guardianCN, SNEP, pwdID, rlGradeLevelComplete, rlLastSYComplete, rlLastSchoolAtt, rlSchoolID, semester, track, strand, distanceLearning, enrollment_status')
        .neq('strand', 'ALS')
        .eq('enrollment_status', 'Enrolled');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching regular students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = searchTerm === '' ||
      student.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.lrn && student.lrn.toString().includes(searchTerm));

    const matchesStrand = sortStrand === '' || student.strand === sortStrand;
    const matchesGradeLevel = sortGradeLevel === '' || student.gradeLevel === sortGradeLevel;
    const matchesSemester = sortSemester === '' || student.semester === sortSemester;

    return matchesSearch && matchesStrand && matchesGradeLevel && matchesSemester;
  });



  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setShowModal(true);
    setIsEditing(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setEditedStudent(null);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    console.log('handleSave called');
    console.log('editedStudent:', editedStudent);
    console.log('editedStudent.lrn:', editedStudent?.lrn);

    if (!editedStudent || !editedStudent.lrn) {
      console.log('Missing editedStudent or lrn, returning');
      return;
    }

    try {
      console.log('Attempting to update student in database...');
      const { data, error } = await supabase
        .from('NewStudents')
        .update(editedStudent)
        .eq('lrn', editedStudent.lrn)
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful, updating local state...');
      console.log('Before state update - students length:', students.length);
      console.log('editedStudent:', editedStudent);

      setSelectedStudent(editedStudent);
      const updatedStudents = students.map(s => {
        console.log('Comparing s.lrn:', s.lrn, 'with editedStudent.lrn:', editedStudent.lrn);
        return s.lrn === editedStudent.lrn ? editedStudent : s;
      });
      console.log('Updated students array:', updatedStudents);
      setStudents(updatedStudents);

      setIsEditing(false);
      alert('Student information updated successfully!');
      console.log('Save operation completed');
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student information');
    }
  };

  const handleInputChange = (field: keyof Student, value: string) => {
    if (editedStudent) {
      setEditedStudent({ ...editedStudent, [field]: value });
    }
  };

  const handleDelete = async (studentLrn: string | undefined) => {
    if (!studentLrn) return;
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabase
        .from('NewStudents')
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
        <h1 className="text-4xl font-bold text-gray-700">Regular Students</h1>
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
        <button
          onClick={() => {
            // Search is now handled by the filteredStudents computed value
          }}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      <div className="bg-white/80 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3">
            List of All Regular Students:
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">SORT BY:</span>
            <select
              value={sortStrand}
              onChange={(e) => setSortStrand(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">STRAND</option>
              <option value="STEM">STEM</option>
              <option value="ABM">ABM</option>
              <option value="HUMSS">HUMSS</option>
              <option value="TVL-ICT">TVL-ICT</option>
            </select>
            <select
              value={sortGradeLevel}
              onChange={(e) => setSortGradeLevel(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">GRADE LEVEL</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
            <select
              value={sortSemester}
              onChange={(e) => setSortSemester(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">SEMESTER</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No regular students found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">LRN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Strand</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">GradeLevel</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Semester</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/50">
                {filteredStudents.map((student) => (
                  <tr key={student.lrn} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(student)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          View
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
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {student.lname}, {student.fname} {student.mname}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.strand}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.gradeLevel}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.semester}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.enrollment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for viewing student details */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-800">Student Details</h2>
                <div className="flex items-center gap-3">
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Save
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[75vh]">
                {/* Personal Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-blue-600 mb-4 border-b-2 border-blue-200 pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">LRN</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.lrn || ''}
                          onChange={(e) => handleInputChange('lrn', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.lrn || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.schoolYear || ''}
                          onChange={(e) => handleInputChange('schoolYear', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.schoolYear || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.gradeLevel || ''}
                          onChange={(e) => handleInputChange('gradeLevel', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.gradeLevel || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">PSA</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.psa || ''}
                          onChange={(e) => handleInputChange('psa', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.psa || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.lname || ''}
                          onChange={(e) => handleInputChange('lname', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.lname || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.fname || ''}
                          onChange={(e) => handleInputChange('fname', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.fname || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.mname || ''}
                          onChange={(e) => handleInputChange('mname', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.mname || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedStudent?.bday || ''}
                          onChange={(e) => handleInputChange('bday', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.bday || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.age || ''}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.age || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                      {isEditing ? (
                        <select
                          value={editedStudent?.sex || ''}
                          onChange={(e) => handleInputChange('sex', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Sex</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.sex || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birthplace</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.birthplace || ''}
                          onChange={(e) => handleInputChange('birthplace', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.birthplace || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.religion || ''}
                          onChange={(e) => handleInputChange('religion', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.religion || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother Tongue</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.motherTongue || ''}
                          onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.motherTongue || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Indigenous People</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.indigenousPeople || ''}
                          onChange={(e) => handleInputChange('indigenousPeople', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.indigenousPeople || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">4Ps</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.fourPS || ''}
                          onChange={(e) => handleInputChange('fourPS', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.fourPS || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-green-600 mb-4 border-b-2 border-green-200 pb-2">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Current Address</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">House Number:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.houseNumber || ''}
                              onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.houseNumber || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Street Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.streetName || ''}
                              onChange={(e) => handleInputChange('streetName', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.streetName || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Barangay:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.barangay || ''}
                              onChange={(e) => handleInputChange('barangay', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.barangay || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Municipality:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.municipality || ''}
                              onChange={(e) => handleInputChange('municipality', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.municipality || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Province:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.province || ''}
                              onChange={(e) => handleInputChange('province', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.province || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Country:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.country || ''}
                              onChange={(e) => handleInputChange('country', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.country || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Zip Code:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.zipCode || ''}
                              onChange={(e) => handleInputChange('zipCode', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.zipCode || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Permanent Address</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">House Number:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pHN || ''}
                              onChange={(e) => handleInputChange('pHN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pHN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Street Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pSN || ''}
                              onChange={(e) => handleInputChange('pSN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pSN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Barangay:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pbrgy || ''}
                              onChange={(e) => handleInputChange('pbrgy', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pbrgy || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Municipality:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pMunicipal || ''}
                              onChange={(e) => handleInputChange('pMunicipal', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pMunicipal || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Province:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pProvince || ''}
                              onChange={(e) => handleInputChange('pProvince', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pProvince || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Country:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pCountry || ''}
                              onChange={(e) => handleInputChange('pCountry', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pCountry || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32">Zip Code:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.pZipCode || ''}
                              onChange={(e) => handleInputChange('pZipCode', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <span>{selectedStudent.pZipCode || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parent/Guardian Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-purple-600 mb-4 border-b-2 border-purple-200 pb-2">Parent/Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Father</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">First Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.fatherFN || ''}
                              onChange={(e) => handleInputChange('fatherFN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.fatherFN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">Middle Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.fatherMN || ''}
                              onChange={(e) => handleInputChange('fatherMN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.fatherMN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">Last Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.fatherLN || ''}
                              onChange={(e) => handleInputChange('fatherLN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.fatherLN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">Contact:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.fatherCN || ''}
                              onChange={(e) => handleInputChange('fatherCN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.fatherCN || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Mother</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">First Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.motherFN || ''}
                              onChange={(e) => handleInputChange('motherFN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.motherFN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">Middle Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.motherMN || ''}
                              onChange={(e) => handleInputChange('motherMN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.motherMN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">Last Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.motherLN || ''}
                              onChange={(e) => handleInputChange('motherLN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.motherLN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">Contact:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.motherCN || ''}
                              onChange={(e) => handleInputChange('motherCN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.motherCN || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-lg font-medium text-gray-800 mb-3">Guardian</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">First Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.guardianFN || ''}
                              onChange={(e) => handleInputChange('guardianFN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.guardianFN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">Last Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.guardianLN || ''}
                              onChange={(e) => handleInputChange('guardianLN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.guardianLN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-20">Contact:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.guardianCN || ''}
                              onChange={(e) => handleInputChange('guardianCN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.guardianCN || 'N/A'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-orange-600 mb-4 border-b-2 border-orange-200 pb-2">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">SNEP</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.SNEP || ''}
                          onChange={(e) => handleInputChange('SNEP', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.SNEP || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">PWD ID</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.pwdID || ''}
                          onChange={(e) => handleInputChange('pwdID', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.pwdID || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">RL Grade Level Completed</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.rlGradeLevelComplete || ''}
                          onChange={(e) => handleInputChange('rlGradeLevelComplete', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.rlGradeLevelComplete || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">RL Last Year Completed</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.rlLastSYComplete || ''}
                          onChange={(e) => handleInputChange('rlLastSYComplete', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.rlLastSYComplete || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">RL Last School Attended</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.rlLastSchoolAtt || ''}
                          onChange={(e) => handleInputChange('rlLastSchoolAtt', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.rlLastSchoolAtt || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">RL School ID</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.rlSchoolID || ''}
                          onChange={(e) => handleInputChange('rlSchoolID', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.rlSchoolID || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                      {isEditing ? (
                        <select
                          value={editedStudent?.semester || ''}
                          onChange={(e) => handleInputChange('semester', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Select Semester</option>
                          <option value="1st">1st</option>
                          <option value="2nd">2nd</option>
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.semester || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Track</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.track || ''}
                          onChange={(e) => handleInputChange('track', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.track || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Strand</label>
                      {isEditing ? (
                        <select
                          value={editedStudent?.strand || ''}
                          onChange={(e) => handleInputChange('strand', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Select Strand</option>
                          <option value="STEM">STEM</option>
                          <option value="ABM">ABM</option>
                          <option value="HUMSS">HUMSS</option>
                          <option value="TVL-ICT">TVL-ICT</option>
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.strand || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distance Learning</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.distanceLearning || ''}
                          onChange={(e) => handleInputChange('distanceLearning', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.distanceLearning || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Status</label>
                      {isEditing ? (
                        <select
                          value={editedStudent?.enrollment_status || ''}
                          onChange={(e) => handleInputChange('enrollment_status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Select Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Enrolled">Enrolled</option>
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.enrollment_status || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end border-t pt-4">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
