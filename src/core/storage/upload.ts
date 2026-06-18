import { supabase } from '@/src/core/supabase';

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  blockId?: string;
  workspaceId: string;
  uploadedAt: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  workspaceId: string,
  blockId?: string
): Promise<UploadedFile> {
  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const filename = `${timestamp}-${random}-${file.name}`;
  const path = `${workspaceId}/${filename}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('workspace-files')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('workspace-files')
    .getPublicUrl(path);

  // Save file metadata to database
  const uploadedFile: UploadedFile = {
    id: `file_${timestamp}_${random}`,
    name: file.name,
    type: file.type,
    size: file.size,
    url: publicUrl,
    blockId,
    workspaceId,
    uploadedAt: timestamp,
  };

  const { error: dbError } = await supabase
    .from('uploaded_files')
    .insert([{
      id: uploadedFile.id,
      workspace_id: workspaceId,
      block_id: blockId,
      name: uploadedFile.name,
      type: uploadedFile.type,
      size: uploadedFile.size,
      url: uploadedFile.url,
      uploaded_at: new Date().toISOString(),
    }]);

  if (dbError) {
    console.error('Failed to save file metadata:', dbError);
  }

  return uploadedFile;
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  workspaceId: string,
  blockId?: string
): Promise<UploadedFile[]> {
  const results: UploadedFile[] = [];

  for (const file of files) {
    try {
      const uploaded = await uploadFile(file, workspaceId, blockId);
      results.push(uploaded);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
    }
  }

  return results;
}

/**
 * Get files for a block
 */
export async function getBlockFiles(blockId: string): Promise<UploadedFile[]> {
  const { data, error } = await supabase
    .from('uploaded_files')
    .select('*')
    .eq('block_id', blockId);

  if (error) return [];

  return (data || []).map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    size: f.size,
    url: f.url,
    blockId: f.block_id,
    workspaceId: f.workspace_id,
    uploadedAt: new Date(f.uploaded_at).getTime(),
  }));
}

/**
 * Delete file
 */
export async function deleteFile(fileId: string, workspaceId: string): Promise<void> {
  // Get file info
  const { data: fileData, error: fetchError } = await supabase
    .from('uploaded_files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (fetchError || !fileData) {
    throw new Error('File not found');
  }

  // Delete from storage
  const path = `${workspaceId}/${fileData.name}`;
  const { error: storageError } = await supabase.storage
    .from('workspace-files')
    .remove([path]);

  if (storageError) {
    console.error('Failed to delete from storage:', storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('uploaded_files')
    .delete()
    .eq('id', fileId);

  if (dbError) {
    throw new Error('Failed to delete file metadata');
  }
}

/**
 * Extract text from uploaded file
 */
export async function extractTextFromFile(file: UploadedFile): Promise<string> {
  try {
    if (file.type === 'text/plain') {
      const response = await fetch(file.url);
      return await response.text();
    }

    if (file.type === 'application/pdf') {
      // Use PDF.js or similar library
      // For now, return placeholder
      return `[PDF: ${file.name}]`;
    }

    if (file.type.startsWith('image/')) {
      // Use OCR or vision API
      return `[Image: ${file.name}]`;
    }

    return '';
  } catch (error) {
    console.error('Failed to extract text:', error);
    return '';
  }
}
