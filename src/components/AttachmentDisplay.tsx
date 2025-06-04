import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Link2, 
  Download, 
  ExternalLink, 
  Trash2,
  File as FileIcon
} from 'lucide-react';
import { CardAttachment } from '@/lib/types';
import { Button } from './ui/Button';

interface AttachmentDisplayProps {
  attachment: CardAttachment;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
}

export function AttachmentDisplay({ 
  attachment, 
  onDelete,
  isEditing = false 
}: AttachmentDisplayProps) {
  // Helper function to get file extension
  const getFileExtension = (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  };
  
  // Helper to get file icon based on type
  const getFileIcon = (attachment: CardAttachment) => {
    if (attachment.type === 'link') {
      return <Link2 className="h-5 w-5 text-teal" />;
    }
    
    if (attachment.type === 'image') {
      return <ImageIcon className="h-5 w-5 text-teal" />;
    }
    
    // Based on file extension
    const ext = attachment.fileType ? 
      attachment.fileType.split('/').pop() : 
      getFileExtension(attachment.name);
    
    switch(ext) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-5 w-5 text-orange" />;
      default:
        return <FileIcon className="h-5 w-5 text-gray-600" />;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (attachment.type === 'image') {
    return (
      <div className="relative group border border-gray-200 rounded-xl overflow-hidden">
        <img 
          src={attachment.url} 
          alt={attachment.name}
          className="w-full h-auto max-h-72 object-contain"
        />
        
        <div className={`${isEditing ? 'flex' : 'hidden group-hover:flex'} absolute top-2 right-2 space-x-2 bg-white/90 backdrop-blur-sm rounded-lg p-1.5`}>
          <a 
            href={attachment.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 bg-teal/10 text-teal hover:bg-teal/20 rounded transition-colors"
            title="View full size"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          
          <a 
            href={attachment.url} 
            download={attachment.name}
            className="p-1.5 bg-teal/10 text-teal hover:bg-teal/20 rounded transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </a>
          
          {isEditing && onDelete && (
            <button 
              onClick={() => onDelete(attachment.id)}
              className="p-1.5 bg-red/10 text-red hover:bg-red/20 rounded transition-colors"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="p-2 bg-gray-50 border-t border-gray-200 text-sm truncate">
          {attachment.name}
        </div>
      </div>
    );
  }
  
  if (attachment.type === 'link') {
    return (
      <div className="flex items-center p-3 bg-teal/5 border border-teal/20 rounded-lg gap-3 hover:bg-teal/10 transition-colors">
        <div>
          <Link2 className="h-5 w-5 text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <a 
            href={attachment.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium hover:underline text-teal truncate block"
          >
            {attachment.name}
          </a>
          <span className="text-xs text-gray-500 truncate block">
            {attachment.url.replace(/^https?:\/\//, '')}
          </span>
        </div>
        {isEditing && onDelete && (
          <button 
            onClick={() => onDelete(attachment.id)}
            className="p-1 text-red hover:bg-red/10 rounded-full"
            title="Remove link"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
  
  // For file attachments
  return (
    <div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg gap-3">
      <div>
        {getFileIcon(attachment)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {attachment.name}
        </div>
        {attachment.size && (
          <span className="text-xs text-gray-500">
            {formatFileSize(attachment.size)}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <a 
          href={attachment.url} 
          download={attachment.name}
          className="p-1.5 bg-teal/10 text-teal hover:bg-teal/20 rounded transition-colors"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
        {isEditing && onDelete && (
          <button 
            onClick={() => onDelete(attachment.id)}
            className="p-1.5 bg-red/10 text-red hover:bg-red/20 rounded transition-colors"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}