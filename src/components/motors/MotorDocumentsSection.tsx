import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, ExternalLink, Loader2, File, Image, Video, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { supabase } from '../../integrations/supabase/client';

interface MediaItem {
  id: string;
  media_type: 'pdf' | 'document' | 'image' | 'video' | 'url';
  media_category: string;
  media_url: string;
  title?: string;
  description?: string;
  file_size?: number;
}

interface MotorDocumentsSectionProps {
  motorId: string;
  motorFamily?: string;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)}KB`;
  return `${mb.toFixed(1)}MB`;
};

const getMediaIcon = (type: string, category: string) => {
  switch (type) {
    case 'pdf':
    case 'document':
      return <FileText className="w-5 h-5" />;
    case 'image':
      return <Image className="w-5 h-5" />;
    case 'video':
      return <Video className="w-5 h-5" />;
    case 'url':
      return <Globe className="w-5 h-5" />;
    default:
      return <File className="w-5 h-5" />;
  }
};

const getCategoryBadgeColor = (category: string) => {
  const colorMap: Record<string, string> = {
    'manual': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    'brochure': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    'specifications': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    'warranty': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    'installation': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    'general': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
  };
  return colorMap[category] || colorMap.general;
};

export default function MotorDocumentsSection({ motorId, motorFamily }: MotorDocumentsSectionProps) {
  const [documents, setDocuments] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDocument, setPreviewDocument] = useState<MediaItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [motorId, motorFamily]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Query for motor-specific documents and family-wide documents
      const { data, error } = await supabase
        .from('motor_media')
        .select('id, media_type, media_category, media_url, title, description, file_size')
        .or(`motor_id.eq.${motorId},and(motor_id.is.null,assignment_type.eq.family)`)
        .in('media_type', ['pdf', 'document', 'url'])
        .eq('is_active', true)
        .order('media_category')
        .order('title');

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: MediaItem) => {
    setDownloadingId(document.id);
    
    try {
      if (document.media_type === 'pdf' || document.media_type === 'document') {
        // Use window.open to force download - works better with Supabase Storage
        const fileName = document.title || `document-${document.id}`;
        const fileExtension = document.media_type === 'pdf' ? '.pdf' : '.doc';
        const finalFileName = fileName.includes('.') ? fileName : fileName + fileExtension;
        
        // Try to trigger download by opening in new window
        const newWindow = window.open(document.media_url, '_blank');
        
        // If popup blocked or other issues, fallback to direct navigation
        if (!newWindow) {
          window.location.href = document.media_url;
        }
      } else if (document.media_type === 'url') {
        window.open(document.media_url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      // Fallback: direct navigation
      window.open(document.media_url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = (document: MediaItem) => {
    if (document.media_type === 'pdf') {
      setPreviewDocument(document);
    } else if (document.media_type === 'url') {
      window.open(document.media_url, '_blank');
    }
  };

  // Group documents by category
  const groupedDocuments = documents.reduce((acc, doc) => {
    const category = doc.media_category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, MediaItem[]>);

  const categoryOrder = ['manual', 'brochure', 'specifications', 'warranty', 'installation', 'general'];
  const sortedCategories = Object.keys(groupedDocuments).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No documents available for this motor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedCategories.map(category => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h4>
          <div className="grid gap-3">
            {groupedDocuments[category].map(document => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getMediaIcon(document.media_type, document.media_category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-sm truncate">
                        {document.title || `${document.media_category} Document`}
                      </h5>
                      <Badge className={`text-xs ${getCategoryBadgeColor(document.media_category)}`}>
                        {document.media_type.toUpperCase()}
                      </Badge>
                    </div>
                    {document.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {document.description}
                      </p>
                    )}
                    {document.file_size && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(document.file_size)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {document.media_type === 'pdf' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(document)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(document)}
                    disabled={downloadingId === document.id}
                    className="h-8 w-8 p-0"
                  >
                    {downloadingId === document.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : document.media_type === 'url' ? (
                      <ExternalLink className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* PDF Preview Dialog */}
      {previewDocument && previewDocument.media_type === 'pdf' && (
        <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{previewDocument.title || 'Document Preview'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              <iframe
                src={`${previewDocument.media_url}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full min-h-[500px] rounded-md border"
                title={previewDocument.title || 'Document Preview'}
                onError={() => {
                  // If iframe fails, open in new tab as fallback
                  window.open(previewDocument.media_url, '_blank');
                  setPreviewDocument(null);
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setPreviewDocument(null)}>
                Close
              </Button>
              <Button onClick={() => handleDownload(previewDocument)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}