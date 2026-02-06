import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { BlogArticle } from '@/data/blogArticles';

interface BlogCardProps {
  article: BlogArticle;
}

export function BlogCard({ article }: BlogCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link 
      to={`/blog/${article.slug}`}
      className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-[16/9] overflow-hidden bg-muted">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#c8102e] to-[#8b0000] text-white">
            <div className="text-center px-4">
              <span className="block text-2xl font-bold tracking-tight">Harris Boat Works</span>
              <span className="block text-xs mt-1 opacity-80 uppercase tracking-widest">Mercury Authorized Dealer</span>
            </div>
          </div>
        ) : (
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="p-5">
        <span className="text-xs font-medium text-primary uppercase tracking-wider">
          {article.category}
        </span>
        <h3 className="mt-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {article.description}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(article.datePublished).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
