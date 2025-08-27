const Class = require('../models/classModel');
const Student = require('../models/studentModel');
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res) => {
    try {
        const { class: classId } = req.query; // Destructure classId from query
        let query = {};

        // If a classId is provided, add it to the query
        if (classId) {
            query.class = classId;
        }

        // If the user is a teacher, filter students by their assigned classes
        if (req.user.role === 'teacher') {
            const teacherClasses = await Class.find({ teacher: req.user._id }).select('_id');
            const teacherClassIds = teacherClasses.map(c => c._id);

            // If a specific classId was requested by the teacher, ensure it's one of their classes
            if (classId && !teacherClassIds.some(id => id.toString() === classId.toString())) {
                return res.status(403).json({ message: 'Not authorized to view students from this class' });
            }
            
            // If no classId was specified, or if it was valid, filter by all teacher's classes
            query.class = { $in: teacherClassIds };
        } else if (req.user.role !== 'admin') {
            // If not admin or teacher, deny access
            return res.status(403).json({ message: 'Not authorized to view students' });
        }

        const students = await Student.find(query).populate('class', 'name');
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
    try {
        let student;
        
        // Handle the 'me' route
        if (req.params.id === 'me') {
            student = await Student.findOne({ user: req.user._id }).populate('class', 'name');
        } else {
            student = await Student.findById(req.params.id).populate('class', 'name');
        }

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Teacher can only view students from their assigned classes
        if (req.user.role === 'teacher') {
            const teacherClasses = await Class.find({ teacher: req.user._id }).select('_id');
            const teacherClassIds = teacherClasses.map(c => c._id.toString());

            if (!student.class || !teacherClassIds.includes(student.class.toString())) {
                return res.status(403).json({ message: 'Not authorized to view this student' });
            }
        }
        
        res.json(student);
    } catch (error) {
        console.error('Error getting student by ID:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = async (req, res) => {
    try {
        const { name, studentId, rfidId, email, class: classId } = req.body;
        
        // Check if class is provided since it's required
        if (!classId) {
            return res.status(400).json({ message: 'Class ID is required' });
        }

        // Check if class exists
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Check if there's a user with this email
        const existingUser = await User.findOne({ email });
        
        // Create the student
        const student = await Student.create({
            name,
            studentId,
            rfidId,
            email,
            class: classId,
            user: existingUser ? existingUser._id : null
        });
        
        // Update the class's students array
        await Class.findByIdAndUpdate(
            classId,
            { $push: { students: student._id } },
            { new: true }
        );
        
        // Return the created student with populated class
        const populatedStudent = await Student.findById(student._id)
            .populate('class', 'name')
            .populate('user', 'name email');
        res.status(201).json(populatedStudent);
    } catch (error) {
        // Check for specific MongoDB validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }
        // Check for duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (student) {
            const oldClassId = student.class;
            const newClassId = req.body.class;

            // If class is being changed
            if (newClassId && oldClassId !== newClassId) {
                // Check if new class exists
                const newClass = await Class.findById(newClassId);
                if (!newClass) {
                    return res.status(404).json({ message: 'New class not found' });
                }

                // Remove student from old class
                if (oldClassId) {
                    await Class.findByIdAndUpdate(
                        oldClassId,
                        { $pull: { students: student._id } }
                    );
                }

                // Add student to new class
                await Class.findByIdAndUpdate(
                    newClassId,
                    { $push: { students: student._id } }
                );
            }

            // Update student fields
            student.name = req.body.name || student.name;
            student.studentId = req.body.studentId || student.studentId;
            student.rfidId = req.body.rfidId || student.rfidId;
            student.email = req.body.email || student.email;
            student.class = newClassId || student.class;
            student.active = req.body.active !== undefined ? req.body.active : student.active;
            
            const updatedStudent = await student.save();
            const populatedStudent = await Student.findById(updatedStudent._id).populate('class', 'name');
            res.json(populatedStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (student) {
            // Remove student from class's students array
            if (student.class) {
                await Class.findByIdAndUpdate(
                    student.class,
                    { $pull: { students: student._id } }
                );
            }
            
            await student.deleteOne();
            res.json({ message: 'Student removed' });
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Import students from CSV
// @route   POST /api/students/import
// @access  Private/Admin
const importStudents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a CSV file' });
        }

        const classId = req.body.classId;
        if (!classId) {
            return res.status(400).json({ message: 'Class ID is required' });
        }

        // Verify class exists
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const errors = [];
        const studentsToCreate = [];
        let rowNumber = 0;

        // Read the CSV file
        const csvData = fs.readFileSync(req.file.path, 'utf8');
        const rows = csvData.split('\n');
        
        // Remove header row and empty rows
        const dataRows = rows.slice(1).filter(row => row.trim());

        // First pass: validate all rows
        for (let i = 0; i < dataRows.length; i++) {
            rowNumber = i + 2; // +2 because we skipped header and array is 0-based
            const row = dataRows[i].split(',').map(field => field.trim());
            
            if (row.length !== 4) {
                errors.push(`Row ${rowNumber}: Invalid number of columns. Expected 4 columns: name, studentId, rfidId, email`);
                continue;
            }

            const [name, studentId, rfidId, email] = row;

            // Validate required fields
            if (!name || !studentId || !rfidId || !email) {
                errors.push(`Row ${rowNumber}: Missing required fields. Required fields: name, studentId, rfidId, email`);
                continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push(`Row ${rowNumber}: Invalid email format: ${email}`);
                continue;
            }

            // Validate studentId format (assuming it should be alphanumeric)
            const studentIdRegex = /^[A-Za-z0-9]+$/;
            if (!studentIdRegex.test(studentId)) {
                errors.push(`Row ${rowNumber}: Invalid student ID format. Should be alphanumeric: ${studentId}`);
                continue;
            }

            // Validate rfidId format (assuming it should be alphanumeric)
            if (!studentIdRegex.test(rfidId)) {
                errors.push(`Row ${rowNumber}: Invalid RFID ID format. Should be alphanumeric: ${rfidId}`);
                continue;
            }

            studentsToCreate.push({
                name,
                studentId,
                rfidId,
                email,
                class: classId
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validation errors found in CSV file',
                errors
            });
        }

        if (studentsToCreate.length === 0) {
            return res.status(400).json({ message: 'No valid student records found in the CSV file' });
        }

        // Check for duplicate entries
        const existingStudents = await Student.find({
            $or: [
                { studentId: { $in: studentsToCreate.map(s => s.studentId) } },
                { rfidId: { $in: studentsToCreate.map(s => s.rfidId) } },
                { email: { $in: studentsToCreate.map(s => s.email) } }
            ]
        });

        if (existingStudents.length > 0) {
            const duplicates = {
                studentIds: existingStudents.map(s => s.studentId),
                rfidIds: existingStudents.map(s => s.rfidId),
                emails: existingStudents.map(s => s.email)
            };
            return res.status(400).json({
                message: 'Duplicate entries found',
                duplicates
            });
        }

        try {
            // Create all students
            const createdStudents = await Student.insertMany(studentsToCreate);

            // Update the class with the new student IDs
            await Class.findByIdAndUpdate(
                classId,
                { $push: { students: { $each: createdStudents.map(s => s._id) } } }
            );

            // Remove temporary file
            try {
                fs.unlinkSync(req.file.path);
            } catch (error) {
                console.error('Error removing temporary file:', error);
            }

            // Fetch updated class to verify
            const updatedClass = await Class.findById(classId)
                .populate('students')
                .select('name students');

            res.status(201).json({
                message: `Successfully imported ${createdStudents.length} students`,
                count: createdStudents.length,
                class: {
                    name: updatedClass.name,
                    studentCount: updatedClass.students.length
                }
            });
        } catch (err) {
            console.error('Error creating students:', {
                error: err.message,
                students: studentsToCreate
            });
            throw new Error(`Failed to create students: ${err.message}`);
        }
    } catch (error) {
        // Clean up the temporary file in case of error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error removing temporary file:', unlinkError);
            }
        }
        console.error('Import error:', error);
        res.status(500).json({
            message: 'Error importing students',
            error: error.message
        });
    }
};

// @desc    Bulk delete students
// @route   DELETE /api/students/bulk-delete
// @access  Private/Admin
const bulkDeleteStudents = asyncHandler(async (req, res) => {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400);
        throw new Error('Please provide an array of student IDs');
    }

    // Validate that all IDs are valid ObjectIds
    const validIds = studentIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
        res.status(400);
        throw new Error('No valid student IDs provided');
    }

    // Delete all students with valid IDs
    const result = await Student.deleteMany({ _id: { $in: validIds } });
    
    if (result.deletedCount === 0) {
        res.status(404);
        throw new Error('No students found to delete');
    }

    res.json({
        message: `Successfully deleted ${result.deletedCount} students`,
        deletedCount: result.deletedCount,
        invalidCount: studentIds.length - validIds.length
    });
});

// @desc    Assign student to class
// @route   PUT /api/students/:id/assign-class
// @access  Private/Admin
const assignStudentToClass = async (req, res) => {
    try {
        const { classId } = req.body;
        const studentId = req.params.id;

        // Check if student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if class exists
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // If student is already in a class, remove them from that class's students array
        if (student.class) {
            await Class.findByIdAndUpdate(
                student.class,
                { $pull: { students: student._id } }
            );
        }

        // Update student's class
        student.class = classId;
        await student.save();

        // Add student to new class's students array
        await Class.findByIdAndUpdate(
            classId,
            { $addToSet: { students: student._id } },
            { new: true }
        );

        // Return the updated student with populated class
        const updatedStudent = await Student.findById(studentId).populate('class', 'name');
        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's own profile
// @route   GET /api/students/me
// @access  Private
const getStudentProfile = async (req, res) => {
  try {
    // Find student by email since that's what we have in common between User and Student
    const student = await Student.findOne({ email: req.user.email })
      .populate('class', 'name')
      .select('-__v');

    if (!student) {
      return res.status(404).json({ 
        message: 'Student profile not found',
        details: 'No student account is linked to your email address'
      });
    }

    // If student exists but user field is not set, update it
    if (!student.user) {
      student.user = req.user._id;
      await student.save();
    }

    res.json(student);
  } catch (error) {
    console.error('Error in getStudentProfile:', error);
    res.status(500).json({ 
      message: 'Error retrieving student profile',
      error: error.message 
    });
  }
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    bulkDeleteStudents,
    assignStudentToClass,
    getStudentProfile
};