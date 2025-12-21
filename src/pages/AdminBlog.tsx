import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { blogArticles, isArticlePublished, BlogArticle } from '@/data/blogArticles';
import AdminNav from '@/components/admin/AdminNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  FileText, 
  Send, 
  Eye, 
  Loader2,
  Download,
  Clock,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BlogSubscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed_at: string;
  is_active: boolean;
}

export default function AdminBlog() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // Fetch subscribers
  const { data: subscribers = [], isLoading: subscribersLoading, refetch: refetchSubscribers } = useQuery({
    queryKey: ['blog-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_subscriptions')
        .select('*')
        .order('subscribed_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogSubscriber[];
    }
  });

  const activeSubscribers = subscribers.filter(s => s.is_active);
  const publishedArticles = blogArticles.filter(a => isArticlePublished(a));
  const scheduledArticles = blogArticles.filter(a => !isArticlePublished(a));

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getArticlesForDay = (day: Date) => {
    return blogArticles.filter(article => {
      const publishDate = parseISO(article.publishDate);
      return isSameDay(publishDate, day);
    });
  };

  const handleSendNotification = async (article: BlogArticle) => {
    if (!confirm(`Send notification for "${article.title}" to ${activeSubscribers.length} subscribers?`)) {
      return;
    }

    setIsSendingNotification(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-blog-notification', {
        body: {
          articleSlug: article.slug,
          articleTitle: article.title,
          articleDescription: article.description,
          articleUrl: `https://harrisboatworks.com/blog/${article.slug}`,
          articleImage: article.image
        }
      });

      if (error) throw error;

      toast.success(`Notification sent to ${data.sent} subscribers`);
    } catch (error: any) {
      console.error('Notification error:', error);
      toast.error(error.message || 'Failed to send notifications');
    } finally {
      setIsSendingNotification(false);
    }
  };

  const exportSubscribers = () => {
    const csv = [
      ['Email', 'Name', 'Subscribed Date', 'Status'].join(','),
      ...subscribers.map(s => [
        s.email,
        s.name || '',
        format(parseISO(s.subscribed_at), 'yyyy-MM-dd'),
        s.is_active ? 'Active' : 'Unsubscribed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Subscribers exported');
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Blog Management</h1>
          <p className="text-muted-foreground">Manage blog posts, subscribers, and notifications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Articles</p>
                  <p className="text-2xl font-bold">{blogArticles.length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold text-green-600">{publishedArticles.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-amber-600">{scheduledArticles.length}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Subscribers</p>
                  <p className="text-2xl font-bold text-blue-600">{activeSubscribers.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-2">
              <Users className="h-4 w-4" />
              Subscribers
            </TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Publishing Calendar</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-medium min-w-[150px] text-center">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  <span className="inline-flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      Published
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      Scheduled
                    </span>
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
                      {day}
                    </div>
                  ))}
                  
                  {/* Empty cells for days before month start */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-start-${i}`} className="bg-background p-2 min-h-[80px]" />
                  ))}
                  
                  {/* Calendar Days */}
                  {calendarDays.map(day => {
                    const dayArticles = getArticlesForDay(day);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "bg-background p-2 min-h-[80px] transition-colors",
                          isToday && "bg-primary/5"
                        )}
                      >
                        <span className={cn(
                          "text-sm",
                          isToday && "font-bold text-primary"
                        )}>
                          {format(day, 'd')}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayArticles.map(article => (
                            <button
                              key={article.slug}
                              onClick={() => setSelectedArticle(article)}
                              className={cn(
                                "w-full text-left text-xs p-1 rounded truncate transition-colors",
                                isArticlePublished(article)
                                  ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                              )}
                            >
                              {article.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty cells for days after month end */}
                  {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="bg-background p-2 min-h-[80px]" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Article Detail Modal */}
            {selectedArticle && (
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedArticle.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {selectedArticle.category} • {format(parseISO(selectedArticle.publishDate), 'MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge variant={isArticlePublished(selectedArticle) ? "default" : "secondary"}>
                      {isArticlePublished(selectedArticle) ? "Published" : "Scheduled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{selectedArticle.description}</p>
                  <div className="flex gap-2">
                    {isArticlePublished(selectedArticle) && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/blog/${selectedArticle.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View Article
                          </a>
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleSendNotification(selectedArticle)}
                          disabled={isSendingNotification || activeSubscribers.length === 0}
                        >
                          {isSendingNotification ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Notify {activeSubscribers.length} Subscribers
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedArticle(null)}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Articles List */}
          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <CardTitle>All Articles</CardTitle>
                <CardDescription>
                  Manage and send notifications for blog posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Publish Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogArticles
                      .sort((a, b) => parseISO(b.publishDate).getTime() - parseISO(a.publishDate).getTime())
                      .map(article => (
                        <TableRow key={article.slug}>
                          <TableCell className="font-medium max-w-[300px] truncate">
                            {article.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{article.category}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(parseISO(article.publishDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isArticlePublished(article) ? "default" : "secondary"}>
                              {isArticlePublished(article) ? "Published" : "Scheduled"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {isArticlePublished(article) && (
                                <>
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={`/blog/${article.slug}`} target="_blank">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendNotification(article)}
                                    disabled={isSendingNotification || activeSubscribers.length === 0}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscribers List */}
          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Blog Subscribers</CardTitle>
                    <CardDescription>
                      {activeSubscribers.length} active, {subscribers.length - activeSubscribers.length} unsubscribed
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={exportSubscribers}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {subscribersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : subscribers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No subscribers yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Subscribed</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map(subscriber => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">{subscriber.email}</TableCell>
                          <TableCell>{subscriber.name || '—'}</TableCell>
                          <TableCell>
                            {format(parseISO(subscriber.subscribed_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={subscriber.is_active ? "default" : "secondary"}>
                              {subscriber.is_active ? "Active" : "Unsubscribed"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
