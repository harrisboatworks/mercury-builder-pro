import { useState, useEffect } from 'react';
import { ChevronDown, List } from 'lucide-react';
import { TOCItem } from '@/utils/slugify';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // Track scroll position and highlight current section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    // Observe all headers
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  if (items.length === 0) return null;

  // Group items by H2 with nested H3s
  const groupedItems: { h2: TOCItem; h3s: TOCItem[] }[] = [];
  let currentGroup: { h2: TOCItem; h3s: TOCItem[] } | null = null;

  items.forEach((item) => {
    if (item.level === 2) {
      if (currentGroup) {
        groupedItems.push(currentGroup);
      }
      currentGroup = { h2: item, h3s: [] };
    } else if (item.level === 3 && currentGroup) {
      currentGroup.h3s.push(item);
    }
  });

  if (currentGroup) {
    groupedItems.push(currentGroup);
  }

  return (
    <nav 
      className="my-8 bg-muted/30 border border-border rounded-xl overflow-hidden"
      aria-label="Table of contents"
    >
      {/* Mobile: Collapsible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left md:hidden"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 font-medium text-foreground">
          <List className="h-4 w-4" />
          Table of Contents
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Desktop: Always visible header */}
      <div className="hidden md:flex items-center gap-2 p-4 pb-2 font-medium text-foreground">
        <List className="h-4 w-4" />
        Table of Contents
      </div>

      {/* Content */}
      <div 
        className={cn(
          "md:block px-4 pb-4",
          isOpen ? "block" : "hidden"
        )}
      >
        <ul className="space-y-1">
          {groupedItems.map((group) => (
            <li key={group.h2.id}>
              <button
                onClick={() => handleClick(group.h2.id)}
                className={cn(
                  "w-full text-left py-1.5 px-3 rounded-md text-sm transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  activeId === group.h2.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {group.h2.text}
              </button>
              
              {group.h3s.length > 0 && (
                <ul className="ml-4 mt-1 space-y-0.5">
                  {group.h3s.map((h3) => (
                    <li key={h3.id}>
                      <button
                        onClick={() => handleClick(h3.id)}
                        className={cn(
                          "w-full text-left py-1 px-3 rounded-md text-sm transition-colors",
                          "hover:bg-muted hover:text-foreground",
                          activeId === h3.id
                            ? "text-primary font-medium"
                            : "text-muted-foreground/80"
                        )}
                      >
                        {h3.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
