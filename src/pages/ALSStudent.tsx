import { useEffect, useState, useRef } from 'react';
import { supabase, Student } from '../lib/supabase';
import { Search } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ALSStudent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [originalLrn, setOriginalLrn] = useState<string | undefined>(undefined);

  const modalContentRef = useRef<HTMLDivElement>(null);

  const filteredStudents = students.filter((student) => {
    const matchesSearch = searchTerm === '' ||
      (student.lname && student.lname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.fname && student.fname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.mname && student.mname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.lrn && student.lrn.toString().includes(searchTerm));

    return matchesSearch;
  });

  useEffect(() => {
    fetchALSStudents();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('als_students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ALS' }, () => {
        fetchALSStudents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchALSStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ALS')
        .select('*')
        .eq('enrollment_status', 'Enrolled');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching ALS students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setOriginalLrn(student.lrn);
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
    if (!editedStudent || !originalLrn) return;

    console.log('Starting save process...');
    console.log('editedStudent:', editedStudent);
    console.log('originalLrn:', originalLrn);

    try {
      // Create a copy of editedStudent and handle array fields properly
      const updateData = { ...editedStudent };
      const processedData: Record<string, unknown> = {};
      const arrayFields = ['distanceLearning']; // Add other array field names here

      Object.keys(updateData).forEach(key => {
        const value = (updateData as Record<string, unknown>)[key];
        if (Array.isArray(value)) {
          processedData[key] = value;
        } else if (arrayFields.includes(key) && typeof value === 'string' && value.trim()) {
          // Convert comma-separated string back to array for array fields
          processedData[key] = value.split(',').map(item => item.trim());
        } else {
          processedData[key] = value;
        }
      });

      console.log('Data being sent to Supabase:', processedData);

      const { error } = await supabase
        .from('ALS')
        .update(processedData)
        .eq('lrn', originalLrn);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful, updating local state...');

      setSelectedStudent(editedStudent);
      setStudents(students.map(s => s.lrn === originalLrn ? editedStudent : s));
      setIsEditing(false);
      alert('Student information updated successfully!');
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

  const handleGeneratePDF = () => {
    const input = modalContentRef.current;

    // Get the grandparent modal container (which has max-h-[95vh])
    const modalContainer = input?.parentElement?.parentElement;

    if (!input || !modalContainer || !selectedStudent) {
      console.error('Modal elements or student not found');
      return;
    }

    // 1. Store original CSS classes to restore them later
    const inputOriginalClass = input.className;
    const containerOriginalClass = modalContainer.className;

    // 2. Temporarily remove all overflow and max-height classes
    input.className = input.className
      .replace('overflow-y-auto', '')
      .replace('max-h-[75vh]', '');
    modalContainer.className = modalContainer.className
      .replace('overflow-hidden', '')
      .replace('max-h-[95vh]', '');

    // 3. Run html2canvas on the now-full-height content
    html2canvas(input, {
      backgroundColor: '#ffffff',
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');

        // 4. Set PDF back to A4 size
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const margin = 10;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const usableWidth = pageWidth - (margin * 2);
        const usableHeight = pageHeight - (margin * 2);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let finalWidth, finalHeight;
        if (canvasRatio < (usableWidth / usableHeight)) {
          finalHeight = usableHeight;
          finalWidth = finalHeight * canvasRatio;
        } else {
          finalWidth = usableWidth;
          finalHeight = finalWidth / canvasRatio;
        }

        const x = margin + (usableWidth - finalWidth) / 2;
        const y = margin;

        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        pdf.save(`student-${selectedStudent.lname}-${selectedStudent.lrn}.pdf`);
      })
      .catch((err) => {
        console.error('Error generating PDF:', err);
        alert('Failed to generate PDF');
      })
      .finally(() => {
        // 5. ALWAYS restore the original classes
        input.className = inputOriginalClass;
        modalContainer.className = containerOriginalClass;
      });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-700">ALS Students</h1>
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
            List of All ALS Students:
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No ALS students found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">LRN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Age</th>
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
                    <td className="px-4 py-3 text-sm text-gray-800">{student.lname}, {student.fname} {student.mname}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{student.age}</td>
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
              <div ref={modalContentRef} className="overflow-y-auto max-h-[75vh]">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="YYYY-MM-DD"
                          value={editedStudent?.date || ''}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.date || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.cn || ''}
                          onChange={(e) => handleInputChange('cn', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.cn || 'N/A'}</p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Extension Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.ename || ''}
                          onChange={(e) => handleInputChange('ename', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.ename || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="YYYY-MM-DD"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.civilStatus || ''}
                          onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.civilStatus || 'N/A'}</p>
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
                          <span className="font-medium w-32 whitespace-nowrap">House Number:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Street Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Barangay:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Municipality:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Province:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Country:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Zip Code:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">House Number:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Street Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Barangay:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Municipality:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Province:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Country:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Zip Code:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">First Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Middle Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Last Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Contact:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">First Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Middle Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Last Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Contact:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">First Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Middle Name:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedStudent?.guardianMN || ''}
                              onChange={(e) => handleInputChange('guardianMN', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <span>{selectedStudent.guardianMN || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium w-32 whitespace-nowrap">Last Name:</span>
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
                          <span className="font-medium w-32 whitespace-nowrap">Contact:</span>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">PWD</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.pwd || ''}
                          onChange={(e) => handleInputChange('pwd', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.pwd || 'N/A'}</p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Education Information</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.education_information || ''}
                          onChange={(e) => handleInputChange('education_information', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.education_information || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">OSY</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.OSY || ''}
                          onChange={(e) => handleInputChange('OSY', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.OSY || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ALS Attended</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.als_attended || ''}
                          onChange={(e) => handleInputChange('als_attended', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.als_attended || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Complete Program</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.complete_program || ''}
                          onChange={(e) => handleInputChange('complete_program', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.complete_program || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">KMS</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.kms || ''}
                          onChange={(e) => handleInputChange('kms', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.kms || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hour</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.hour || ''}
                          onChange={(e) => handleInputChange('hour', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.hour || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transportation</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.transportation || ''}
                          onChange={(e) => handleInputChange('transportation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.transportation || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.day || ''}
                          onChange={(e) => handleInputChange('day', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.day || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedStudent?.time || ''}
                          onChange={(e) => handleInputChange('time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedStudent.time || 'N/A'}</p>
                      )}
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distance Learning</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={Array.isArray(editedStudent?.distanceLearning) ? editedStudent.distanceLearning.join(', ') : editedStudent?.distanceLearning || ''}
                          onChange={(e) => handleInputChange('distanceLearning', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{Array.isArray(selectedStudent.distanceLearning) ? selectedStudent.distanceLearning.join(', ') : selectedStudent.distanceLearning || 'N/A'}</p>
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
                  onClick={handleGeneratePDF}
                  className="mr-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Download PDF
                </button>
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
