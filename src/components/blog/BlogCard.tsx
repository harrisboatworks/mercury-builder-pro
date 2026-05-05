import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { BlogArticle } from '@/data/blogArticles';
import { getCleanDescription } from '@/lib/strip-markdown';

interface BlogCardProps {
  article: BlogArticle;
}

export function BlogCard({ article }: BlogCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to={`/blog/${article.slug}`}
      className="group block bg-white rounded-lg overflow-hidden border border-repower-navy-900/10 card-hover"
    >
      <div className="aspect-[16/9] overflow-hidden bg-repower-paper">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-repower-navy-900 text-white">
            <div className="text-center px-4">
              <span className="block text-2xl font-display font-bold tracking-tight">Harris Boat Works</span>
              <span className="block text-xs mt-1 opacity-80 uppercase tracking-widest">Mercury Authorized Dealer</span>
            </div>
          </div>
        ) : (
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="p-5">
        <span className="font-sans text-[11px] font-semibold text-repower-mercury-red uppercase tracking-[0.2em]">
          {article.category}
        </span>
        <h3 className="mt-2 font-display text-lg font-semibold text-repower-navy-900 group-hover:text-repower-mercury-red transition-colors line-clamp-2" style={{ letterSpacing: '-0.015em' }}>
          {article.title}
        </h3>
        <p className="mt-2 font-sans text-sm text-repower-navy-900/65 line-clamp-2 leading-relaxed">
          {article.description}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-repower-navy-900/55">
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
