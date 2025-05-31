
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Assignment = Database['public']['Tables']['assignments']['Row'];
type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
type Submission = Database['public']['Tables']['submissions']['Row'];
type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];

export interface AssignmentWithSubmissions extends Assignment {
  submissions: Submission[];
}

class AssignmentService {
  async getAssignments(): Promise<AssignmentWithSubmissions[]> {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        submissions (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      throw new Error(error.message);
    }

    return assignments as AssignmentWithSubmissions[];
  }

  async createAssignment(assignment: Omit<AssignmentInsert, 'created_by'>): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        ...assignment,
        created_by: (await supabase.auth.getUser()).data.user?.id!
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async updateAssignment(id: string, updates: Partial<AssignmentInsert>): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async deleteAssignment(id: string): Promise<void> {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting assignment:', error);
      throw new Error(error.message);
    }
  }

  async submitAssignment(submission: {
    assignmentId: string;
    content?: string;
    file?: File;
  }): Promise<Submission> {
    let fileUrl = null;
    let fileName = null;
    let fileType = null;

    // Upload file if provided
    if (submission.file) {
      const user = (await supabase.auth.getUser()).data.user;
      const filePath = `submissions/${user?.id}/${submission.assignmentId}/${submission.file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('classroom-files')
        .upload(filePath, submission.file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('classroom-files')
        .getPublicUrl(filePath);

      fileUrl = urlData.publicUrl;
      fileName = submission.file.name;
      fileType = submission.file.type;
    }

    const { data, error } = await supabase
      .from('submissions')
      .upsert({
        assignment_id: submission.assignmentId,
        student_id: (await supabase.auth.getUser()).data.user?.id!,
        content: submission.content,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting assignment:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async gradeSubmission(submissionId: string, grade: number, feedback?: string): Promise<Submission> {
    const { data, error } = await supabase
      .from('submissions')
      .update({ grade, feedback })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('Error grading submission:', error);
      throw new Error(error.message);
    }

    return data;
  }
}

export const assignmentService = new AssignmentService();
