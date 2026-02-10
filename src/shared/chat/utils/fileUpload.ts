/**
 * NEURALTWIN Chat File Upload Utility
 * 파일을 Supabase Storage에 업로드하고 텍스트 콘텐츠를 추출
 */

import { supabase } from '@/integrations/supabase/client';

const STORAGE_BUCKET = 'chat-attachments';

const TEXT_TYPES = ['text/plain', 'text/csv', 'text/markdown'];
const MAX_TEXT_LENGTH = 5000;

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  textContent?: string;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function uploadChatFile(
  file: File,
  sessionId: string
): Promise<UploadedFile> {
  const fileId = crypto.randomUUID();
  const ext = file.name.split('.').pop() || 'bin';
  const storagePath = `${sessionId}/${fileId}.${ext}`;

  // Supabase Storage 업로드
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`파일 업로드 실패: ${error.message}`);
  }

  // Public URL 생성
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  // 텍스트 파일은 내용 추출
  let textContent: string | undefined;
  if (TEXT_TYPES.includes(file.type)) {
    try {
      const raw = await readFileAsText(file);
      textContent = raw.length > MAX_TEXT_LENGTH
        ? raw.slice(0, MAX_TEXT_LENGTH) + '\n...(truncated)'
        : raw;
    } catch {
      console.warn('[FileUpload] Failed to read text content:', file.name);
    }
  }

  return {
    id: fileId,
    name: file.name,
    size: file.size,
    type: file.type,
    url: urlData.publicUrl,
    textContent,
  };
}

export async function uploadChatFiles(
  files: File[],
  sessionId: string
): Promise<UploadedFile[]> {
  const results = await Promise.allSettled(
    files.map(file => uploadChatFile(file, sessionId))
  );

  const uploaded: UploadedFile[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      uploaded.push(result.value);
    } else {
      console.error('[FileUpload] Upload failed:', result.reason);
    }
  }
  return uploaded;
}
