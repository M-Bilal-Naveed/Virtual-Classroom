
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { persistentStorage } from '../../utils/persistentStorage';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Upload,
  Download,
  Eye
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  createdBy: string;
  createdAt: Date;
  submissions?: Submission[];
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
}

const Assignments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: 100
  });

  // Load assignments from persistent storage
  useEffect(() => {
    const data = persistentStorage.getData();
    setAssignments(data.assignments || []);
  }, []);

  // Save assignments to persistent storage
  useEffect(() => {
    persistentStorage.updateAssignments(assignments);
  }, [assignments]);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAssignment: Assignment = {
      id: editingAssignment ? editingAssignment.id : Date.now().toString(),
      ...formData,
      createdBy: user?.id || '',
      createdAt: new Date(),
      submissions: editingAssignment ? editingAssignment.submissions : []
    };

    if (editingAssignment) {
      setAssignments(prev => prev.map(a => a.id === editingAssignment.id ? newAssignment : a));
      toast({
        title: "Assignment updated!",
        description: "The assignment has been successfully updated.",
      });
    } else {
      setAssignments(prev => [...prev, newAssignment]);
      toast({
        title: "Assignment created!",
        description: "The assignment has been successfully created.",
      });
    }

    setFormData({ title: '', description: '', dueDate: '', points: 100 });
    setShowForm(false);
    setEditingAssignment(null);
  };

  const handleSubmitAssignment = (assignmentId: string) => {
    if (!submissionContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter your submission content.",
        variant: "destructive",
      });
      return;
    }

    const submission: Submission = {
      id: Date.now().toString(),
      assignmentId,
      studentId: user?.id || '',
      studentName: user?.name || '',
      content: submissionContent,
      submittedAt: new Date()
    };

    setAssignments(prev => prev.map(assignment => {
      if (assignment.id === assignmentId) {
        const existingSubmissions = assignment.submissions || [];
        // Remove existing submission from this student if any
        const filteredSubmissions = existingSubmissions.filter(s => s.studentId !== user?.id);
        return {
          ...assignment,
          submissions: [...filteredSubmissions, submission]
        };
      }
      return assignment;
    }));

    setSubmissionContent('');
    setSelectedAssignmentId(null);
    
    toast({
      title: "Assignment submitted!",
      description: "Your assignment has been successfully submitted.",
    });
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    toast({
      title: "Assignment deleted",
      description: "The assignment has been successfully deleted.",
    });
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      points: assignment.points
    });
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    if (user?.role === 'admin') return null;
    
    const userSubmission = assignment.submissions?.find(s => s.studentId === user?.id);
    return userSubmission ? 'submitted' : 'pending';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (user?.role !== 'admin' && user?.role !== 'student') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">Please login to access assignments.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' ? 'Create and manage assignments' : 'View and submit assignments'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        )}
      </div>

      {/* Assignment Form for Admin */}
      {showForm && user?.role === 'admin' && (
        <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</span>
            </CardTitle>
            <CardDescription>
              {editingAssignment ? 'Update assignment details' : 'Create a new assignment for your students'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAssignment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Assignment Title</label>
                    <Input
                      placeholder="e.g., Math Quiz Chapter 5"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Points</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                    <Textarea
                      placeholder="Detailed assignment instructions..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button type="submit" className="flex-1">
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingAssignment(null);
                    setFormData({ title: '', description: '', dueDate: '', points: 100 });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      <div className="grid grid-cols-1 gap-6">
        {assignments.map((assignment) => {
          const daysUntilDue = getDaysUntilDue(assignment.dueDate);
          const status = getSubmissionStatus(assignment);
          const userSubmission = assignment.submissions?.find(s => s.studentId === user?.id);

          return (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <span>{assignment.title}</span>
                      {status && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'submitted' 
                            ? 'bg-green-100 text-green-800' 
                            : daysUntilDue < 0 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {status === 'submitted' ? 'Submitted' : daysUntilDue < 0 ? 'Overdue' : 'Pending'}
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">{assignment.description}</CardDescription>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditAssignment(assignment)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {formatDate(assignment.dueDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {daysUntilDue > 0 
                        ? `${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} left`
                        : daysUntilDue === 0 
                        ? 'Due today'
                        : `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} overdue`
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{assignment.points} points</span>
                  </div>
                </div>

                {/* Student Submission Section */}
                {user?.role === 'student' && (
                  <div className="border-t pt-4">
                    {userSubmission ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Assignment Submitted</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          Submitted on: {new Date(userSubmission.submittedAt).toLocaleString()}
                        </p>
                        <div className="bg-white rounded p-3 text-sm">
                          <strong>Your submission:</strong>
                          <p className="mt-1">{userSubmission.content}</p>
                        </div>
                        {userSubmission.grade !== undefined && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <strong>Grade: {userSubmission.grade}/{assignment.points}</strong>
                            {userSubmission.feedback && (
                              <p className="mt-1 text-sm">
                                <strong>Feedback:</strong> {userSubmission.feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                          <span className="font-medium">Submit Your Assignment</span>
                        </div>
                        {selectedAssignmentId === assignment.id ? (
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Enter your assignment submission here..."
                              value={submissionContent}
                              onChange={(e) => setSubmissionContent(e.target.value)}
                              rows={4}
                            />
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => handleSubmitAssignment(assignment.id)}
                                disabled={!submissionContent.trim()}
                              >
                                Submit Assignment
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedAssignmentId(null);
                                  setSubmissionContent('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => setSelectedAssignmentId(assignment.id)}
                            disabled={daysUntilDue < 0}
                            className={daysUntilDue < 0 ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {daysUntilDue < 0 ? 'Assignment Overdue' : 'Start Submission'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Admin View: Submissions */}
                {user?.role === 'admin' && assignment.submissions && assignment.submissions.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4 flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Submissions ({assignment.submissions.length})</span>
                    </h4>
                    <div className="space-y-3">
                      {assignment.submissions.map((submission) => (
                        <div key={submission.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium">{submission.studentName}</span>
                              <p className="text-sm text-gray-600">
                                Submitted: {new Date(submission.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            {submission.grade !== undefined && (
                              <div className="text-right">
                                <span className="font-medium text-green-600">
                                  {submission.grade}/{assignment.points}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="bg-white rounded p-3 text-sm">
                            <p>{submission.content}</p>
                          </div>
                          {submission.feedback && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <strong>Feedback:</strong> {submission.feedback}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {assignments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {user?.role === 'admin' ? 'No assignments created yet' : 'No assignments available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {user?.role === 'admin' 
                ? 'Create your first assignment to get started' 
                : 'Check back later for new assignments'}
            </p>
            {user?.role === 'admin' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Assignments;
