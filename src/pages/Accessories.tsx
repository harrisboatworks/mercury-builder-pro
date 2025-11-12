import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { AccessoryCard } from '@/components/accessories/AccessoryCard';
import { ACCESSORIES_DATA, ACCESSORY_CATEGORIES } from '@/lib/accessories-data';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function Accessories() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const filteredAccessories = selectedCategory === 'all' 
    ? ACCESSORIES_DATA 
    : ACCESSORIES_DATA.filter(acc => acc.category === selectedCategory);

  return (
    <>
      <LuxuryHeader />
      
      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 pt-6 pb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Accessories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <main className="container mx-auto px-4 pt-2 pb-16">
        {/* Header Section */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-4">
            Premium Marine Accessories
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            Genuine Mercury parts and accessories to enhance your boating experience
          </p>
        </header>
        
        {/* Category Filter Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-12">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-transparent h-auto">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-foreground data-[state=active]:text-background font-light"
            >
              All Products
            </TabsTrigger>
            {Object.entries(ACCESSORY_CATEGORIES).map(([key, category]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="data-[state=active]:bg-foreground data-[state=active]:text-background font-light"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Category Description */}
        {selectedCategory !== 'all' && (
          <div className="mb-8 text-center">
            <p className="text-muted-foreground font-light">
              {ACCESSORY_CATEGORIES[selectedCategory as keyof typeof ACCESSORY_CATEGORIES].description}
            </p>
          </div>
        )}
        
        {/* Accessories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          {filteredAccessories.map((accessory) => (
            <AccessoryCard key={accessory.id} accessory={accessory} />
          ))}
        </div>
        
        {/* Empty State */}
        {filteredAccessories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-light text-lg">
              No accessories found in this category.
            </p>
          </div>
        )}
        
        {/* Bottom CTA Section */}
        <div className="mt-16 text-center border-t pt-12">
          <h2 className="text-2xl font-light mb-4">Need Help Choosing?</h2>
          <p className="text-muted-foreground font-light mb-6 max-w-xl mx-auto">
            Our marine experts can help you select the perfect accessories for your setup
          </p>
          <Link to="/contact">
            <Button variant="luxuryModern" size="lg">
              Contact Our Team
            </Button>
          </Link>
        </div>
      </main>
    </>
  );
}
