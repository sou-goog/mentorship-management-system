// server/controllers/leaveController.js
const mongoose = require('mongoose');
const LeaveApplication = require('../models/LeaveApplication');
const User = require('../models/User');
const htmlPdfNode = require('html-pdf-node');

// --- Controller Functions ---

const submitLeaveApplication = async (req, res, next) => {
  const { startDate, endDate, leaveType, reason } = req.body;
  const menteeId = req.user._id;
  try {
    if (!startDate || !endDate || !leaveType || !reason) {
      res.status(400);
      throw new Error('Please provide all required fields: startDate, endDate, leaveType, and reason.');
    }
    let documentsToStore = [];
    if (req.files && req.files.length > 0) {
      documentsToStore = req.files.map(file => ({
        originalName: file.originalname,
        filePath: file.filename,
        fileType: file.mimetype,
      }));
    }
    const leaveApplication = await LeaveApplication.create({
      mentee: menteeId,
      startDate,
      endDate,
      leaveType,
      reason,
      supportingDocuments: documentsToStore,
    });
    res.status(201).json(leaveApplication);
  } catch (error) {
    if (error.message && error.message.startsWith('Error: File type not allowed!')) {
        res.status(400);
    }
    next(error);
  }
};

const getMyLeaveApplications = async (req, res, next) => {
  try {
    const applications = await LeaveApplication.find({ mentee: req.user._id })
      .populate('mentee', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

const withdrawLeaveApplication = async (req, res, next) => {
  try {
    const leaveApplication = await LeaveApplication.findById(req.params.id);
    if (!leaveApplication) {
      res.status(404); throw new Error('Leave application not found');
    }
    if (leaveApplication.mentee.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized to withdraw this leave application');
    }
    const nonWithdrawableStatuses = ['Approved', 'Rejected_Dean', 'Withdrawn'];
    if (nonWithdrawableStatuses.includes(leaveApplication.status)) {
      res.status(400); throw new Error(`Leave application cannot be withdrawn. Current status: ${leaveApplication.status}`);
    }
    leaveApplication.status = 'Withdrawn';
    leaveApplication.rejectionReason = undefined;
    const updatedApplication = await leaveApplication.save();
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

const getPendingMentorApprovals = async (req, res, next) => {
  try {
    const mentorWithMentees = await User.findById(req.user._id).select('assignedMentees');
    if (!mentorWithMentees || !mentorWithMentees.assignedMentees || mentorWithMentees.assignedMentees.length === 0) {
      return res.json([]);
    }
    const assignedMentees = mentorWithMentees.assignedMentees;
    const pendingApplications = await LeaveApplication.find({
      status: 'Pending_Mentor',
      mentee: { $in: assignedMentees },
    }).populate('mentee', 'firstName lastName email role department').sort({ createdAt: 'asc' });
    res.json(pendingApplications);
  } catch (error) {
    next(error);
  }
};

const approveLeaveByMentor = async (req, res, next) => {
  try {
    const leaveApplication = await LeaveApplication.findById(req.params.id);
    if (!leaveApplication) { res.status(404); throw new Error('Leave application not found'); }
    const menteeOfApplication = await User.findById(leaveApplication.mentee);
    if (!menteeOfApplication || menteeOfApplication.assignedMentor?.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized to approve this leave application');
    }
    if (leaveApplication.status !== 'Pending_Mentor') {
      res.status(400); throw new Error(`Leave application is not pending mentor approval. Current status: ${leaveApplication.status}`);
    }
    leaveApplication.status = 'Pending_HOD';
    leaveApplication.rejectionReason = undefined;
    const updatedApplication = await leaveApplication.save();
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

const rejectLeaveByMentor = async (req, res, next) => {
  const { rejectionReason } = req.body;
  try {
    if (!rejectionReason || rejectionReason.trim() === '') {
      res.status(400); throw new Error('Rejection reason is required');
    }
    const leaveApplication = await LeaveApplication.findById(req.params.id);
    if (!leaveApplication) { res.status(404); throw new Error('Leave application not found'); }
    const menteeOfApplication = await User.findById(leaveApplication.mentee);
    if (!menteeOfApplication || menteeOfApplication.assignedMentor?.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not authorized to reject this leave application');
    }
    if (leaveApplication.status !== 'Pending_Mentor') {
      res.status(400); throw new Error(`Leave application is not pending mentor approval. Current status: ${leaveApplication.status}`);
    }
    leaveApplication.status = 'Rejected_Mentor';
    leaveApplication.rejectionReason = rejectionReason;
    const updatedApplication = await leaveApplication.save();
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

const getPendingHODApprovals = async (req, res, next) => {
  try {
    const hodDepartment = req.user.department;
    if (!hodDepartment) { res.status(400); throw new Error('HOD is not assigned to a department.'); }
    const menteesInDepartment = await User.find({ department: hodDepartment, role: 'Mentee' }).select('_id');
    const menteeIdsInDepartment = menteesInDepartment.map(mentee => mentee._id);
    if (menteeIdsInDepartment.length === 0) return res.json([]);
    const pendingApplications = await LeaveApplication.find({
      status: 'Pending_HOD',
      mentee: { $in: menteeIdsInDepartment },
    }).populate('mentee', 'firstName lastName email department').sort({ createdAt: 'asc' });
    res.json(pendingApplications);
  } catch (error) {
    next(error);
  }
};

// VVVVVV ENSURE THIS FUNCTION DEFINITION IS CORRECT VVVVVV
const approveLeaveByHOD = async (req, res, next) => {
  try {
    const leaveApplication = await LeaveApplication.findById(req.params.id).populate('mentee', 'department');
    if (!leaveApplication) { 
      res.status(404); 
      throw new Error('Leave application not found'); 
    }
    if (!leaveApplication.mentee || leaveApplication.mentee.department !== req.user.department) {
      res.status(403); 
      throw new Error('Not authorized to approve this leave application (department mismatch).');
    }
    if (leaveApplication.status !== 'Pending_HOD') {
      res.status(400); 
      throw new Error(`Leave application is not pending HOD approval. Current status: ${leaveApplication.status}`);
    }
    leaveApplication.status = 'Pending_Dean';
    leaveApplication.rejectionReason = undefined;
    const updatedApplication = await leaveApplication.save();
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

const rejectLeaveByHOD = async (req, res, next) => {
  const { rejectionReason } = req.body;
  try {
    if (!rejectionReason || rejectionReason.trim() === '') {
      res.status(400); throw new Error('Rejection reason is required');
    }
    const leaveApplication = await LeaveApplication.findById(req.params.id).populate('mentee', 'department');
    if (!leaveApplication) { res.status(404); throw new Error('Leave application not found'); }
    if (!leaveApplication.mentee || leaveApplication.mentee.department !== req.user.department) {
      res.status(403); throw new Error('Not authorized to reject this leave application (department mismatch).');
    }
    if (leaveApplication.status !== 'Pending_HOD') {
      res.status(400); throw new Error(`Leave application is not pending HOD approval. Current status: ${leaveApplication.status}`);
    }
    leaveApplication.status = 'Rejected_HOD';
    leaveApplication.rejectionReason = rejectionReason;
    const updatedApplication = await leaveApplication.save();
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

const getPendingDeanApprovals = async (req, res, next) => {
  try {
    const pendingApplications = await LeaveApplication.find({ status: 'Pending_Dean' })
      .populate('mentee', 'firstName lastName email department').sort({ createdAt: 'asc' });
    res.json(pendingApplications);
  } catch (error) {
    next(error);
  }
};

const approveLeaveByDean = async (req, res, next) => {
  try {
    const leaveApplication = await LeaveApplication.findById(req.params.id);
    if (!leaveApplication) { res.status(404); throw new Error('Leave application not found'); }
    if (leaveApplication.status !== 'Pending_Dean') {
      res.status(400); throw new Error(`Leave application is not pending Dean approval. Current status: ${leaveApplication.status}`);
    }
    leaveApplication.status = 'Approved';
    leaveApplication.rejectionReason = undefined;
    const updatedApplication = await leaveApplication.save();
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

const rejectLeaveByDean = async (req, res, next) => {
  const { rejectionReason } = req.body;
  try {
    if (!rejectionReason || rejectionReason.trim() === '') {
      res.status(400); throw new Error('Rejection reason is required');
    }
    const leaveApplication = await LeaveApplication.findById(req.params.id);
    if (!leaveApplication) { res.status(404); throw new Error('Leave application not found'); }
    if (leaveApplication.status !== 'Pending_Dean') {
      res.status(400); throw new Error(`Leave application is not pending Dean approval. Current status: ${leaveApplication.status}`);
    }
    leaveApplication.status = 'Rejected_Dean';
    leaveApplication.rejectionReason = rejectionReason;
    const updatedApplication = await leaveApplication.save();
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

const getLeaveApplicationDetails = async (req, res, next) => {
  try {
    const leaveId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      res.status(400);
      throw new Error('Invalid leave application ID format');
    }
    const leaveApplication = await LeaveApplication.findById(leaveId)
      .populate('mentee', 'firstName lastName email department');
    if (!leaveApplication) {
      res.status(404);
      throw new Error('Leave application not found.');
    }
    res.json(leaveApplication);
  } catch (error) {
    console.error('Error in getLeaveApplicationDetails (BACKEND):', error);
    next(error);
  }
};

const downloadLeaveApplicationAsPDF = async (req, res, next) => {
  try {
    const leaveId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      res.status(400); throw new Error('Invalid leave application ID format');
    }
    const leaveApp = await LeaveApplication.findById(leaveId).populate('mentee', 'firstName lastName email department');
    if (!leaveApp) {
      res.status(404); throw new Error('Leave application not found.');
    }
    const menteeName = `${leaveApp.mentee?.firstName || ''} ${leaveApp.mentee?.lastName || ''}`.trim();
    const menteeLastNameForFile = leaveApp.mentee?.lastName || 'Mentee';
    const submissionDateForFile = new Date(leaveApp.createdAt).toISOString().split('T')[0];
    const filename = `LeaveApplication_${menteeLastNameForFile}_${submissionDateForFile}_${leaveApp._id.toString().substring(0,8)}.pdf`;
    const htmlContent = `
      <html><head><meta charset="UTF-8"><style>body{font-family:Helvetica,Arial,sans-serif;margin:30px;font-size:11pt;color:#333}.container{border:1px solid #ccc;padding:20px;border-radius:5px}h1{text-align:center;color:#2c3e50;border-bottom:2px solid #2c3e50;padding-bottom:10px;margin-bottom:30px;font-size:20pt}.section{margin-bottom:25px;padding-bottom:15px;border-bottom:1px dotted #eee}.section:last-child{border-bottom:none;margin-bottom:0}.section-header{font-size:14pt;font-weight:bold;color:#34495e;margin-bottom:10px}.details-grid{display:grid;grid-template-columns:160px 1fr;gap:6px 12px}.details-grid dt{font-weight:bold;color:#555}.details-grid dd{margin-left:0;word-break:break-word}ul{padding-left:20px;margin-top:5px}li{margin-bottom:3px}.footer{text-align:center;font-size:9pt;color:#777;margin-top:40px}.note{font-size:9pt;color:#555;margin-bottom:10px}</style></head><body><div class="container"><h1>Leave Application Form</h1><div class="section"><div class="section-header">Applicant Information</div><div class="details-grid"><dt>Mentee Name:</dt><dd>${menteeName||'N/A'}</dd><dt>Mentee Email:</dt><dd>${leaveApp.mentee?.email||'N/A'}</dd><dt>Department:</dt><dd>${leaveApp.mentee?.department||'N/A'}</dd></div></div><div class="section"><div class="section-header">Leave Details</div><div class="details-grid"><dt>Start Date:</dt><dd>${new Date(leaveApp.startDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</dd><dt>End Date:</dt><dd>${new Date(leaveApp.endDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</dd><dt>Leave Type:</dt><dd>${leaveApp.leaveType||'N/A'}</dd><dt>Reason:</dt><dd>${leaveApp.reason||'N/A'}</dd></div></div><div class="section"><div class="section-header">Application Status & History</div><div class="details-grid"><dt>Current Status:</dt><dd>${leaveApp.status.replace(/_/g,' ')}</dd>${leaveApp.rejectionReason?`<dt>Rejection Reason:</dt><dd>${leaveApp.rejectionReason}</dd>`:''}
      <dt>Submitted On:</dt><dd>${new Date(leaveApp.createdAt).toLocaleString('en-US')}</dd><dt>Last Updated:</dt><dd>${new Date(leaveApp.updatedAt).toLocaleString('en-US')}</dd></div></div>
      <div class="section"><div class="section-header">Supporting Documents (Names)</div>${leaveApp.supportingDocuments&&leaveApp.supportingDocuments.length>0?`<p class="note">Note: Actual document files can be viewed/downloaded from the online system.</p><ul>${leaveApp.supportingDocuments.map(doc=>`<li>${doc.originalName||'Unnamed Document'} (Filename on server: ${doc.filePath})</li>`).join('')}</ul>`:`<p>None provided.</p>`}</div></div><div class="footer">Generated by Mentorship Management System</div></body></html>`;
    const pdfOptions = { format: 'A4' };
    let fileToConvert = { content: htmlContent };
    htmlPdfNode.generatePdf(fileToConvert, pdfOptions).then(pdfBuffer => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    }).catch(pdfError => {
      console.error("PDF Generation Error:", pdfError);
      next(new Error('Failed to generate PDF for download.'));
    });
  } catch (error) {
    console.error("Error in downloadLeaveApplicationAsPDF controller:", error);
    next(error);
  }
};

// Using explicit key: value for exports
module.exports = {
  submitLeaveApplication: submitLeaveApplication,
  getMyLeaveApplications: getMyLeaveApplications,
  withdrawLeaveApplication: withdrawLeaveApplication,
  getPendingMentorApprovals: getPendingMentorApprovals,
  approveLeaveByMentor: approveLeaveByMentor,
  rejectLeaveByMentor: rejectLeaveByMentor,
  getPendingHODApprovals: getPendingHODApprovals,
  approveLeaveByHOD: approveLeaveByHOD, // <<< ENSURE THIS NAME MATCHES THE DEFINITION
  rejectLeaveByHOD: rejectLeaveByHOD,
  getPendingDeanApprovals: getPendingDeanApprovals,
  approveLeaveByDean: approveLeaveByDean,
  rejectLeaveByDean: rejectLeaveByDean,
  getLeaveApplicationDetails: getLeaveApplicationDetails,
  downloadLeaveApplicationAsPDF: downloadLeaveApplicationAsPDF
};