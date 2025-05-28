
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { persistentStorage } from '../../utils/persistentStorage';
import { 
  FileText, 
  Upload, 
  Download, 
  Calendar, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  submissionFormat: string;
  attachments: string[];
  submissions: Submission[];
  createdAt: Date;
}

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: Date;
  files: string[];
  grade?: number;
  feedback?: string;
}

const Assignments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxPoints: 100,
    submissionFormat: 'pdf'
  });

  // Load assignments from persistent storage on component mount
  useEffect(() => {
    const data = persistentStorage.getData();
    setAssignments(data.assignments.map(assignment => ({
      ...assignment,
      createdAt: assignment.createdAt ? new Date(assignment.createdAt) : new Date(),
      submissions: assignment.submissions.map((sub: any) => ({
        ...sub,
        submittedAt: new Date(sub.submittedAt)
      }))
    })));
  }, []);

  // Save assignments to persistent storage whenever assignments change
  useEffect(() => {
    persistentStorage.updateAssignments(assignments);
  }, [assignments]);

  // Auto-remove overdue assignments (optional feature)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setAssignments(prev => prev.filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        const daysSinceOverdue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceOverdue < 30; // Remove assignments 30 days after due date
      }));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      ...formData,
      attachments: [],
      submissions: [],
      createdAt: new Date()
    };

    setAssignments(prev => [newAssignment, ...prev]);
    setFormData({ title: '', description: '', dueDate: '', maxPoints: 100, submissionFormat: 'pdf' });
    setShowCreateForm(false);
    
    toast({
      title: "Assignment created successfully!",
      description: "The assignment has been created and is visible to students.",
    });
  };

  const handleSubmitAssignment = (assignmentId: string) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to submit.",
        variant: "destructive",
      });
      return;
    }

    const newSubmission: Submission = {
      id: Date.now().toString(),
      studentId: user?.id || '',
      studentName: user?.name || '',
      submittedAt: new Date(),
      files: [selectedFile.name]
    };

    setAssignments(prev => prev.map(assignment => 
      assignment.id === assignmentId 
        ? { ...assignment, submissions: [...assignment.submissions, newSubmission] }
        : assignment
    ));

    setSelectedFile(null);
    toast({
      title: "Assignment submitted successfully!",
      description: "Your assignment has been submitted and saved.",
    });
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
    toast({
      title: "Assignment deleted successfully",
      description: "The assignment has been permanently removed.",
    });
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    if (user?.role === 'admin') return null;
    
    const userSubmission = assignment.submissions.find(s => s.studentId === user?.id);
    const isOverdue = new Date() > new Date(assignment.dueDate);
    
    if (userSubmission) {
      return { status: 'submitted', color: 'bg-green-500', text: 'Submitted' };
    } else if (isOverdue) {
      return { status: 'overdue', color: 'bg-red-500', text: 'Overdue' };
    } else {
      return { status: 'pending', color: 'bg-yellow-500', text: 'Pending' };
    }
  };

  const activeAssignments = assignments.filter(assignment => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    return dueDate >= now || assignment.submissions.some(s => s.studentId === user?.id);
  });

  const submittedAssignments = assignments.filter(assignment => 
    assignment.submissions.some(s => s.studentId === user?.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' ? 'Create and manage assignments with persistent storage' : 'View and submit your assignments'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        )}
      </div>

      {/* Create Assignment Form */}
      {showCreateForm && user?.role === 'admin' && (
        <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle>Create New Assignment</CardTitle>
            <CardDescription>Set up a new assignment for your students</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
                  <Input
                    placeholder="Assignment title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
                  <Input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                <Textarea
                  placeholder="Assignment instructions and requirements"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Max Points</label>
                  <Input
                    type="number"
                    value={formData.maxPoints}
                    onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Submission Format</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.submissionFormat}
                    onChange={(e) => setFormData({ ...formData, submissionFormat: e.target.value })}
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">Document</option>
                    <option value="image">Image</option>
                    <option value="any">Any Format</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button type="submit">Create Assignment</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          {user?.role === 'admin' && <TabsTrigger value="submissions">Submissions</TabsTrigger>}
          {user?.role === 'student' && <TabsTrigger value="submitted">My Submissions</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {activeAssignments.map((assignment) => {
            const status = getSubmissionStatus(assignment);
            const daysUntilDue = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        {status && (
                          <Badge className={`${status.color} text-white`}>
                            {status.text}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{assignment.description}</CardDescription>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteAssignment(assignment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{assignment.maxPoints} points</span>
                    </div>
                  </div>

                  {user?.role === 'student' && !assignment.submissions.find(s => s.studentId === user.id) && daysUntilDue > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Submit Assignment:</h4>
                      <div className="flex items-center space-x-4">
                        <Input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          accept={assignment.submissionFormat === 'pdf' ? '.pdf' : 
                                 assignment.submissionFormat === 'doc' ? '.doc,.docx' :
                                 assignment.submissionFormat === 'image' ? '.jpg,.jpeg,.png' : '*'}
                        />
                        <Button 
                          onClick={() => handleSubmitAssignment(assignment.id)}
                          disabled={!selectedFile}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit
                        </Button>
                      </div>
                    </div>
                  )}

                  {user?.role === 'admin' && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {assignment.submissions.length} submission(s)
                        </span>
                      </div>
                    </div>
                  )}

                  {user?.role === 'student' && assignment.submissions.find(s => s.studentId === user.id) && (
                    <div className="border-t pt-4">
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Assignment submitted successfully</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {user?.role === 'student' && (
          <TabsContent value="submitted" className="space-y-6">
            {submittedAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <CardDescription>{assignment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {assignment.submissions.filter(s => s.studentId === user.id).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">Submitted on {submission.submittedAt.toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">Files: {submission.files.join(', ')}</p>
                        {submission.grade && (
                          <p className="text-sm text-green-600">Grade: {submission.grade}/{assignment.maxPoints}</p>
                        )}
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>

      {activeAssignments.length === 0 && !showCreateForm && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments available</h3>
            <p className="text-gray-600 mb-4">
              {user?.role === 'admin' ? 'Create your first assignment to get started' : 'No assignments have been posted yet'}
            </p>
            {user?.role === 'admin' && (
              <Button onClick={() => setShowCreateForm(true)}>
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
