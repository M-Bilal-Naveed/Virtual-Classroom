
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
    // Get material to find file path for storage deletion
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching material for deletion:', fetchError);
      throw new Error(fetchError.message);
    }

    // Extract file path from URL and delete from storage
    if (material?.file_url) {
      try {
        // Parse the URL to extract the file path
        const url = new URL(material.file_url);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'classroom-files');
        
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          // Reconstruct the file path from the URL
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          console.log('Deleting file from storage:', filePath);
          
          const { error: storageError } = await supabase.storage
            .from('classroom-files')
            .remove([filePath]);
          
          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // Continue with database deletion even if storage deletion fails
          } else {
            console.log('File deleted from storage successfully');
          }
        }
      } catch (error) {
        console.error('Error parsing file URL for storage deletion:', error);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete material record from database
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting material from database:', error);
      throw new Error(error.message);
    }

    console.log('Material deleted successfully from database');
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
