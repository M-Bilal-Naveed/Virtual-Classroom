
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { materialService } from '../../services/materialService';
import type { Database } from '@/integrations/supabase/types';
import { 
  FolderOpen, 
  Upload, 
  Download, 
  File, 
  FileText, 
  Image, 
  Video,
  Plus,
  Trash2,
  Eye,
  Search,
  ExternalLink,
  CloudUpload
} from 'lucide-react';

type Material = Database['public']['Tables']['materials']['Row'];

const Materials = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'lecture-notes'
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialService.getMaterials();
      setMaterials(data);
    } catch (error) {
      toast({
        title: "Error loading materials",
        description: "Failed to load materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Materials' },
    { value: 'lecture-notes', label: 'Lecture Notes' },
    { value: 'assignments', label: 'Assignments' },
    { value: 'reference', label: 'Reference Materials' },
    { value: 'recordings', label: 'Lecture Recordings' },
    { value: 'presentations', label: 'Presentations' }
  ];

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'application/pdf':
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'video/mp4':
      case 'video/avi':
      case 'video':
      case 'mp4':
      case 'avi':
        return <Video className="h-8 w-8 text-purple-500" />;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-8 w-8 text-blue-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      await materialService.uploadMaterial({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        file: selectedFile
      });

      setFormData({ title: '', description: '', category: 'lecture-notes' });
      setSelectedFile(null);
      setShowUploadForm(false);
      
      toast({
        title: "Material uploaded successfully!",
        description: "The material has been uploaded and is now available to students.",
      });

      loadMaterials();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (material: Material) => {
    try {
      await materialService.incrementDownload(material.id);
      
      // Create a more secure download approach
      const response = await fetch(material.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = material.file_name;
      link.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `Downloading ${material.file_name}`,
      });

      // Update local state to reflect download count increase
      setMaterials(prev => prev.map(m => 
        m.id === material.id ? { ...m, downloads: (m.downloads || 0) + 1 } : m
      ));
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the file.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (material: Material) => {
    window.open(material.file_url, '_blank');
    
    toast({
      title: "Opening preview",
      description: `Previewing ${material.file_name}`,
    });
  };

  const handleDelete = async (material: Material) => {
    try {
      await materialService.deleteMaterial(material.id);
      toast({
        title: "Material deleted",
        description: "The material has been permanently removed.",
      });
      loadMaterials();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the file.",
        variant: "destructive",
      });
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Materials</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' ? 'Upload and manage course materials with Supabase Storage' : 'Access and download course materials'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button 
            onClick={() => setShowUploadForm(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Material
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && user?.role === 'admin' && (
        <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CloudUpload className="h-5 w-5 text-purple-600" />
              <span>Upload New Material</span>
            </CardTitle>
            <CardDescription>Upload files to Supabase Storage and share with students</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
                  <Input
                    placeholder="Material title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.slice(1).map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                <Textarea
                  placeholder="Brief description of the material"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">File</label>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
              </div>
              <div className="flex space-x-4">
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Material'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select 
          className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMaterials.map((material) => (
          <Card key={material.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getFileIcon(material.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{material.title}</CardTitle>
                  <CardDescription className="mt-1">{material.description}</CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {categories.find(c => c.value === material.category)?.label}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {material.downloads || 0} downloads
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <CloudUpload className="h-3 w-3 mr-1" />
                      Supabase
                    </Badge>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(material)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">{material.file_name}</span>
                  <span>{material.file_size}</span>
                </div>
                <span>
                  {new Date(material.uploaded_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Uploaded by User ID: {material.uploaded_by.slice(0, 8)}...
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handlePreview(material)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" onClick={() => handleDownload(material)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(material.file_url, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'No materials have been uploaded yet'}
            </p>
            {user?.role === 'admin' && !searchTerm && (
              <Button onClick={() => setShowUploadForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload First Material
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Materials;
