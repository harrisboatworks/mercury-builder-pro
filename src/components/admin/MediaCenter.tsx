import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaUploadHub } from './media/MediaUploadHub';
import { DropboxIntegration } from './media/DropboxIntegration';
import { BulkAssignmentRules } from './media/BulkAssignmentRules';
import { MediaLibrary } from './media/MediaLibrary';
import { MotorMediaManager } from './media/MotorMediaManager';
import { Image, FileText, Video, Link as LinkIcon, FolderSync } from 'lucide-react';

export function MediaCenter() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-6 w-6" />
            Motor Media Center
          </CardTitle>
          <CardDescription>
            Comprehensive media management for motors - upload images, PDFs, videos, manage Dropbox sync, and create bulk assignment rules.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Upload Hub
          </TabsTrigger>
          <TabsTrigger value="dropbox" className="flex items-center gap-2">
            <FolderSync className="h-4 w-4" />
            Dropbox Sync
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Bulk Rules
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Media Library
          </TabsTrigger>
          <TabsTrigger value="motors" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Motor Manager
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <MediaUploadHub />
        </TabsContent>

        <TabsContent value="dropbox">
          <DropboxIntegration />
        </TabsContent>

        <TabsContent value="rules">
          <BulkAssignmentRules />
        </TabsContent>

        <TabsContent value="library">
          <MediaLibrary />
        </TabsContent>

        <TabsContent value="motors">
          <MotorMediaManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}