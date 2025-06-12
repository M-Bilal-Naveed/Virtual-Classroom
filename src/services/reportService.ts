
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { classService } from './classService';

type ClassroomReport = Database['public']['Tables']['classroom_reports']['Row'];
type ClassroomReportInsert = Database['public']['Tables']['classroom_reports']['Insert'];

class ReportService {
  async getReports(): Promise<ClassroomReport[]> {
    console.log('Fetching classroom reports from Supabase...');
    
    try {
      const { data: reports, error } = await supabase
        .from('classroom_reports')
        .select('*')
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        throw new Error(error.message);
      }

      console.log('Successfully fetched', reports?.length || 0, 'reports');
      return reports || [];
    } catch (error) {
      console.error('Error in getReports:', error);
      return [];
    }
  }

  async generateWeeklyReport(weekStartDate: string, weekEndDate: string): Promise<ClassroomReport> {
    console.log('Generating weekly report for:', weekStartDate, 'to', weekEndDate);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    // Fetch classes for the week
    const classes = await classService.getClasses();
    const weekClasses = classes.filter(cls => {
      const classDate = new Date(cls.date);
      const startDate = new Date(weekStartDate);
      const endDate = new Date(weekEndDate);
      return classDate >= startDate && classDate <= endDate;
    });

    const reportData = {
      totalClasses: weekClasses.length,
      classes: weekClasses.map(cls => ({
        id: cls.id,
        title: cls.title,
        date: cls.date,
        time: cls.time,
        duration: cls.duration,
        instructor: cls.profiles?.name || 'Unknown'
      })),
      summary: {
        totalDuration: weekClasses.reduce((sum, cls) => sum + cls.duration, 0),
        uniqueInstructors: [...new Set(weekClasses.map(cls => cls.profiles?.name).filter(Boolean))].length
      }
    };

    const { data, error } = await supabase
      .from('classroom_reports')
      .insert({
        title: `Weekly Report: ${weekStartDate} to ${weekEndDate}`,
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        report_data: reportData,
        generated_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error generating report:', error);
      throw new Error(error.message);
    }

    console.log('Report generated successfully:', data);
    return data;
  }

  async deleteReport(reportId: string): Promise<void> {
    console.log('Deleting report:', reportId);
    
    const { error } = await supabase
      .from('classroom_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting report:', error);
      throw new Error(error.message);
    }

    console.log('Report deleted successfully');
  }

  async downloadReport(reportId: string): Promise<string> {
    console.log('Downloading report:', reportId);
    
    const { data: report, error } = await supabase
      .from('classroom_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      throw new Error(error.message);
    }

    // Generate downloadable content
    const reportContent = JSON.stringify(report.report_data, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return 'Report downloaded successfully';
  }
}

export const reportService = new ReportService();
