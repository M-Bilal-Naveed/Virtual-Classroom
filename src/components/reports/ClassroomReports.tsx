
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';
import { FileText, Download, Plus, Calendar } from 'lucide-react';

const ClassroomReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    week_start_date: '',
    week_end_date: ''
  });

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['classroom-reports'],
    queryFn: () => reportService.getReports(),
    enabled: !!user,
  });

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.week_start_date || !formData.week_end_date) {
      toast({
        title: "Error",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    
    try {
      await reportService.generateWeeklyReport(formData.week_start_date, formData.week_end_date);
      toast({
        title: "Report generated successfully!",
        description: "The weekly classroom report has been created and saved.",
      });

      setFormData({ week_start_date: '', week_end_date: '' });
      setShowForm(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      await reportService.downloadReport(reportId);
      toast({
        title: "Download started",
        description: "The report is being downloaded to your device.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classroom Reports</h1>
          <p className="text-gray-600">View and download weekly classroom activity reports</p>
        </div>
        {user?.role === 'admin' && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <Card className="mb-8 bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Generate Weekly Report</span>
            </CardTitle>
            <CardDescription>
              Create a comprehensive report of all scheduled classes for a specific week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Week Start Date</label>
                <Input
                  type="date"
                  value={formData.week_start_date}
                  onChange={(e) => setFormData({ ...formData, week_start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Week End Date</label>
                <Input
                  type="date"
                  value={formData.week_end_date}
                  onChange={(e) => setFormData({ ...formData, week_end_date: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-end space-x-4">
                <Button type="submit" disabled={generating} className="flex-1">
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ week_start_date: '', week_end_date: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const reportData = report.report_data as any;
          
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {new Date(report.generated_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{report.week_start_date} to {report.week_end_date}</span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Total Classes</p>
                        <p className="text-lg font-bold text-blue-600">{reportData?.totalClasses || 0}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Total Duration</p>
                        <p className="text-lg font-bold text-green-600">{reportData?.summary?.totalDuration || 0} min</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleDownloadReport(report.id)}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {reports.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports available</h3>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'Generate your first weekly classroom report' 
                : 'Check back later for classroom reports'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClassroomReports;
