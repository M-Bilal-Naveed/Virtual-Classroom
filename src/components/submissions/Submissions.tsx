
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { assignmentService, AssignmentWithSubmissions } from '../../services/assignmentService';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Upload, 
  Download, 
  User, 
  Clock, 
  CheckCircle, 
  Star,
  Edit3,
  Save
} from 'lucide-react';

const Submissions = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<AssignmentWithSubmissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) return;
      
      try {
        setLoading(true);
        const assignments = await assignmentService.getAssignments();
        const foundAssignment = assignments.find(a => a.id === assignmentId);
        
        if (foundAssignment) {
          setAssignment(foundAssignment);
          
          // If student, pre-fill their existing submission
          if (user?.role === 'student') {
            const userSubmission = foundAssignment.submissions?.find(s => s.student_id === user.id);
            if (userSubmission?.content) {
              setSubmissionText(userSubmission.content);
            }
          }
        }
      } catch (error) {
        console.error('Error loading assignment:', error);
        toast({
          title: "Error",
          description: "Failed to load assignment details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [assignmentId, user, toast]);

  const handleSubmission = async () => {
    if (!assignmentId || (!submissionText.trim() && !submissionFile)) {
      toast({
        title: "Missing Content",
        description: "Please provide either text content or upload a file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await assignmentService.submitAssignment({
        assignmentId,
        content: submissionText.trim() || undefined,
        file: submissionFile || undefined,
      });

      toast({
        title: "Success!",
        description: "Your assignment has been submitted successfully.",
      });

      // Reload assignment to show updated submission
      const assignments = await assignmentService.getAssignments();
      const updatedAssignment = assignments.find(a => a.id === assignmentId);
      if (updatedAssignment) {
        setAssignment(updatedAssignment);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrading = async (submissionId: string) => {
    const grade = parseInt(gradeInput);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast({
        title: "Invalid Grade",
        description: "Please enter a valid grade between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignmentService.gradeSubmission(submissionId, grade, feedbackInput.trim() || undefined);
      
      toast({
        title: "Success!",
        description: "Grade and feedback have been saved.",
      });

      // Reload assignment to show updated grades
      const assignments = await assignmentService.getAssignments();
      const updatedAssignment = assignments.find(a => a.id === assignmentId);
      if (updatedAssignment) {
        setAssignment(updatedAssignment);
      }

      setGradingSubmissionId(null);
      setGradeInput('');
      setFeedbackInput('');
    } catch (error) {
      console.error('Error grading submission:', error);
      toast({
        title: "Grading Failed",
        description: "There was an error saving the grade. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignment Not Found</h3>
            <p className="text-gray-600">The assignment you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userSubmission = assignment.submissions?.find(s => s.student_id === user?.id);
  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Assignment Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-purple-600" />
            <span>{assignment.title}</span>
          </CardTitle>
          <CardDescription>{assignment.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Due Date</p>
              <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {dueDate.toLocaleDateString()} {isOverdue && '(Overdue)'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Points</p>
              <p className="text-sm text-gray-900">{assignment.points}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Submissions</p>
              <p className="text-sm text-gray-900">{assignment.submissions?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Submission Form */}
      {user?.role === 'student' && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
            <CardDescription>
              {userSubmission ? 'Update your submission' : 'Submit your assignment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userSubmission && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Submitted</span>
                  <Badge variant="outline">
                    {userSubmission.grade !== null ? `${userSubmission.grade}/100` : 'Not Graded'}
                  </Badge>
                </div>
                <p className="text-sm text-green-700">
                  Submitted on {new Date(userSubmission.submitted_at).toLocaleString()}
                </p>
                {userSubmission.feedback && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-green-800">Feedback:</p>
                    <p className="text-sm text-green-700">{userSubmission.feedback}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Submission
              </label>
              <Textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Enter your assignment text here..."
                rows={6}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Upload
              </label>
              <Input
                type="file"
                onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                className="w-full"
              />
              {userSubmission?.file_url && (
                <div className="mt-2">
                  <a
                    href={userSubmission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download current file: {userSubmission.file_name}</span>
                  </a>
                </div>
              )}
            </div>

            <Button 
              onClick={handleSubmission} 
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {userSubmission ? 'Update Submission' : 'Submit Assignment'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Admin View: All Submissions */}
      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
            <CardDescription>
              View and grade student submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignment.submissions && assignment.submissions.length > 0 ? (
              <div className="space-y-4">
                {assignment.submissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Student ID: {submission.student_id}</p>
                          <p className="text-sm text-gray-600 flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(submission.submitted_at).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.grade !== null ? (
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>{submission.grade}/100</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Graded</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGradingSubmissionId(submission.id);
                            setGradeInput(submission.grade?.toString() || '');
                            setFeedbackInput(submission.feedback || '');
                          }}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Grade
                        </Button>
                      </div>
                    </div>

                    {submission.content && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Text Submission:</p>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          {submission.content}
                        </div>
                      </div>
                    )}

                    {submission.file_url && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">File:</p>
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>{submission.file_name}</span>
                        </a>
                      </div>
                    )}

                    {submission.feedback && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                        <div className="bg-blue-50 p-3 rounded text-sm">
                          {submission.feedback}
                        </div>
                      </div>
                    )}

                    {/* Grading Form */}
                    {gradingSubmissionId === submission.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded border space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Grade (0-100)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={gradeInput}
                            onChange={(e) => setGradeInput(e.target.value)}
                            placeholder="Enter grade"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Feedback
                          </label>
                          <Textarea
                            value={feedbackInput}
                            onChange={(e) => setFeedbackInput(e.target.value)}
                            placeholder="Enter feedback for the student..."
                            rows={3}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleGrading(submission.id)}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save Grade
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => setGradingSubmissionId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No submissions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Submissions;
