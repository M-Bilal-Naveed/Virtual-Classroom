
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Class = Database['public']['Tables']['classes']['Row'];
type ClassInsert = Database['public']['Tables']['classes']['Insert'];

export interface ClassWithProfile extends Class {
  profiles: {
    name: string;
    role: string;
  } | null;
}

class ClassService {
  async getClasses(): Promise<ClassWithProfile[]> {
    console.log('Fetching classes from Supabase...');
    
    try {
      const { data: classes, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching classes:', error);
        throw new Error(error.message);
      }

      // Fetch profiles separately and join manually
      const creatorIds = [...new Set(classes?.map(cls => cls.created_by) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('id', creatorIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const classesWithProfiles: ClassWithProfile[] = (classes || []).map(classItem => ({
        ...classItem,
        profiles: profilesMap.get(classItem.created_by) || null
      }));

      console.log('Successfully fetched', classesWithProfiles.length, 'classes');
      return classesWithProfiles;
    } catch (error) {
      console.error('Error in getClasses:', error);
      return [];
    }
  }

  async createClass(classData: Omit<ClassInsert, 'created_by'>): Promise<Class> {
    console.log('Creating class:', classData);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('classes')
      .insert({
        ...classData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating class:', error);
      throw new Error(error.message);
    }

    console.log('Class created successfully:', data);
    return data;
  }

  async updateClass(id: string, classData: Partial<ClassInsert>): Promise<Class> {
    console.log('Updating class:', id, classData);
    
    const { data, error } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating class:', error);
      throw new Error(error.message);
    }

    console.log('Class updated successfully:', data);
    return data;
  }

  async deleteClass(id: string): Promise<void> {
    console.log('Deleting class:', id);
    
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting class:', error);
      throw new Error(error.message);
    }

    console.log('Class deleted successfully');
  }
}

export const classService = new ClassService();
