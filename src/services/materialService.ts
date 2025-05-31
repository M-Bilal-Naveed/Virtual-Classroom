
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Material = Database['public']['Tables']['materials']['Row'];
type MaterialInsert = Database['public']['Tables']['materials']['Insert'];

class MaterialService {
  async getMaterials(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching materials:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async uploadMaterial(material: {
    title: string;
    description?: string;
    category: string;
    file: File;
  }): Promise<Material> {
    const user = (await supabase.auth.getUser()).data.user;
    const filePath = `materials/${user?.id}/${Date.now()}_${material.file.name}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('classroom-files')
      .upload(filePath, material.file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from('classroom-files')
      .getPublicUrl(filePath);

    // Create material record
    const { data, error } = await supabase
      .from('materials')
      .insert({
        title: material.title,
        description: material.description,
        file_name: material.file.name,
        file_type: material.file.type,
        file_size: `${(material.file.size / 1024 / 1024).toFixed(1)} MB`,
        file_url: urlData.publicUrl,
        category: material.category,
        uploaded_by: user?.id!
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating material:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async deleteMaterial(id: string): Promise<void> {
    // Get material to find file path
    const { data: material } = await supabase
      .from('materials')
      .select('file_url')
      .eq('id', id)
      .single();

    if (material?.file_url) {
      // Extract file path from URL
      const url = new URL(material.file_url);
      const filePath = url.pathname.split('/storage/v1/object/public/classroom-files/')[1];
      
      if (filePath) {
        await supabase.storage
          .from('classroom-files')
          .remove([filePath]);
      }
    }

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting material:', error);
      throw new Error(error.message);
    }
  }

  async incrementDownload(id: string): Promise<void> {
    // Get current download count and increment it
    const { data: currentMaterial, error: fetchError } = await supabase
      .from('materials')
      .select('downloads')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current downloads:', fetchError);
      return;
    }

    const newDownloadCount = (currentMaterial.downloads || 0) + 1;

    const { error } = await supabase
      .from('materials')
      .update({ downloads: newDownloadCount })
      .eq('id', id);
    
    if (error) {
      console.error('Error incrementing download count:', error);
    }
  }
}

export const materialService = new MaterialService();
