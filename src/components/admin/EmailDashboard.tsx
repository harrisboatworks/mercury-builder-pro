import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, TestTube, Plus, Edit, Trash2, Eye, Copy } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function EmailDashboard() {
  const [emailData, setEmailData] = useState({
    customerName: '',
    customerEmail: '',
    quoteNumber: '',
    motorModel: '',
    totalPrice: '',
    emailType: 'quote_delivery'
  });
  
  // Template management state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    type: 'quote_delivery',
    subject: '',
    html_content: '',
    variables: ['customerName', 'quoteNumber', 'motorModel', 'totalPrice'],
    is_active: true
  });
  
  const { toast } = useToast();

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('type', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateFormData.name,
            subject: templateFormData.subject,
            html_content: templateFormData.html_content,
            variables: templateFormData.variables,
            is_active: templateFormData.is_active
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            name: templateFormData.name,
            type: templateFormData.type,
            subject: templateFormData.subject,
            html_content: templateFormData.html_content,
            variables: templateFormData.variables,
            is_active: templateFormData.is_active
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }

      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
      loadTemplates();
      resetTemplateForm();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      html_content: template.html_content,
      variables: template.variables,
      is_active: template.is_active
    });
    setIsTemplateDialogOpen(true);
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(null);
    setTemplateFormData({
      name: `${template.name} (Copy)`,
      type: template.type,
      subject: template.subject,
      html_content: template.html_content,
      variables: template.variables,
      is_active: false
    });
    setIsTemplateDialogOpen(true);
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      name: '',
      type: 'quote_delivery',
      subject: '',
      html_content: '',
      variables: ['customerName', 'quoteNumber', 'motorModel', 'totalPrice'],
      is_active: true
    });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('html_content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateFormData.html_content;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setTemplateFormData(prev => ({ ...prev, html_content: newText }));
    }
  };

  const getPreviewContent = () => {
    if (!selectedTemplate) return '';
    
    let content = selectedTemplate.html_content;
    const sampleData = {
      customerName: 'John Smith',
      quoteNumber: '2025-001',
      motorModel: 'Mercury 115HP',
      totalPrice: '12,500'
    };
    
    // Replace variables with sample data
    Object.entries(sampleData).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'table', 'tr', 'td', 'th', 'tbody', 'thead'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'id', 'target', 'rel']
    });
  };

  const handleSendEmail = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          customerEmail: emailData.customerEmail,
          customerName: emailData.customerName,
          quoteNumber: emailData.quoteNumber,
          motorModel: emailData.motorModel,
          totalPrice: parseFloat(emailData.totalPrice) || 0,
          emailType: emailData.emailType
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email sent successfully",
      });

      // Reset form
      setEmailData({
        customerName: '',
        customerEmail: '',
        quoteNumber: '',
        motorModel: '',
        totalPrice: '',
        emailType: 'quote_delivery'
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  const handleTestEmail = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          customerEmail: 'test@harrisboatworks.ca',
          customerName: 'Test Customer',
          quoteNumber: 'TEST-001',
          motorModel: 'Mercury 115HP Test',
          totalPrice: 12500,
          emailType: 'quote_delivery'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test email sent successfully",
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quote Emails</p>
              <p className="text-2xl font-bold">124</p>
            </div>
            <Mail className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Follow-ups</p>
              <p className="text-2xl font-bold">38</p>
            </div>
            <Send className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Templates</p>
              <p className="text-2xl font-bold">{templates.length}</p>
            </div>
            <TestTube className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Send Email</TabsTrigger>
          <TabsTrigger value="templates">Manage Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Email Manually</CardTitle>
              <CardDescription>
                Send emails to customers for quotes, follow-ups, or reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={emailData.customerName}
                    onChange={(e) => setEmailData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={emailData.customerEmail}
                    onChange={(e) => setEmailData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="customer@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quoteNumber">Quote Number</Label>
                  <Input
                    id="quoteNumber"
                    value={emailData.quoteNumber}
                    onChange={(e) => setEmailData(prev => ({ ...prev, quoteNumber: e.target.value }))}
                    placeholder="2025-001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="motorModel">Motor Model</Label>
                  <Input
                    id="motorModel"
                    value={emailData.motorModel}
                    onChange={(e) => setEmailData(prev => ({ ...prev, motorModel: e.target.value }))}
                    placeholder="Mercury 115HP"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Total Price ($)</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    value={emailData.totalPrice}
                    onChange={(e) => setEmailData(prev => ({ ...prev, totalPrice: e.target.value }))}
                    placeholder="12500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailType">Email Type</Label>
                  <Select
                    value={emailData.emailType}
                    onValueChange={(value) => setEmailData(prev => ({ ...prev, emailType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select email type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quote_delivery">Quote Delivery</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSendEmail} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                
                <Button onClick={handleTestEmail} variant="outline">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Email System
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Manage your email templates for different types of communications
                </CardDescription>
              </div>
              <Button onClick={() => {
                resetTemplateForm();
                setSelectedTemplate(null);
                setIsTemplateDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {template.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          Variables: {template.variables.map(v => `{{${v}}}`).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsPreviewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No templates found. Create your first template to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Create or modify email templates with dynamic variables
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              
              {!selectedTemplate && (
                <div className="space-y-2">
                  <Label htmlFor="template-type">Template Type</Label>
                  <Select
                    value={templateFormData.type}
                    onValueChange={(value) => setTemplateFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quote_delivery">Quote Delivery</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="template-subject">Subject Line</Label>
                <Input
                  id="template-subject"
                  value={templateFormData.subject}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject with {{variables}}"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="template-active"
                  checked={templateFormData.is_active}
                  onCheckedChange={(checked) => setTemplateFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="template-active">Active Template</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-1">
                  {templateFormData.variables.map((variable) => (
                    <Button
                      key={variable}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable)}
                      className="text-xs"
                    >
                      {`{{${variable}}}`}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="html_content">HTML Content</Label>
              <Textarea
                id="html_content"
                value={templateFormData.html_content}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, html_content: e.target.value }))}
                placeholder="Enter HTML email content..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {selectedTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how the template will look with sample data
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg p-4 max-h-[60vh] overflow-y-auto">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(getPreviewContent(), {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'div', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'img', 'hr'],
                  ALLOWED_ATTR: ['href', 'class', 'style', 'src', 'alt', 'width', 'height', 'target', 'rel']
                })
              }}
              className="prose max-w-none"
            />
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}