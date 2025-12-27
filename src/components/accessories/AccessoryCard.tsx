import { useState } from 'react';
import { Phone, Mail, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Accessory } from '@/lib/accessories-data';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { useLocallyInventory } from '@/hooks/useLocallyInventory';
import mercuryLogo from '@/assets/mercury-logo.png';

interface AccessoryCardProps {
  accessory: Accessory;
}

function LiveStockBadge({ 
  liveStock, 
  isLoading, 
  error, 
  fallbackInStock,
  onRefresh 
}: { 
  liveStock: { inStock: boolean; quantity?: number } | null;
  isLoading: boolean;
  error: string | null;
  fallbackInStock?: boolean;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return <Skeleton className="h-6 w-24" />;
  }

  if (error || !liveStock) {
    // Fall back to static data with indicator
    if (fallbackInStock) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
            In Stock
          </Badge>
          <span className="text-xs text-muted-foreground">(unverified)</span>
        </div>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Check Availability
      </Badge>
    );
  }

  const { inStock, quantity } = liveStock;

  if (!inStock) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="font-medium">
          Out of Stock
        </Badge>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onRefresh}
          title="Refresh stock"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (quantity !== undefined && quantity > 0) {
    const isLowStock = quantity <= 2;
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="default" 
          className={`font-medium ${
            isLowStock 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-green-50 text-green-700 border-green-200'
          }`}
        >
          {isLowStock ? 'Low Stock' : 'In Stock'} ({quantity})
        </Badge>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onRefresh}
          title="Refresh stock"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 font-medium">
        In Stock
      </Badge>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6" 
        onClick={onRefresh}
        title="Refresh stock"
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
    </div>
  );
}

function LivePriceDisplay({
  liveStock,
  isLoading,
  staticPrice,
  staticMsrp,
}: {
  liveStock: { price?: number } | null;
  isLoading: boolean;
  staticPrice: number | null;
  staticMsrp?: number | null;
}) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }

  const displayPrice = liveStock?.price ?? staticPrice;
  const showLiveIndicator = liveStock?.price !== undefined && liveStock.price !== staticPrice;

  return (
    <div>
      {staticMsrp && displayPrice && staticMsrp > displayPrice && (
        <p className="text-sm text-muted-foreground line-through font-normal">
          MSRP: ${staticMsrp.toLocaleString()}
        </p>
      )}
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold text-foreground">
          {displayPrice ? `$${displayPrice.toLocaleString()}` : 'Call for Price'}
        </p>
        {showLiveIndicator && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Live
          </Badge>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function AccessoryCard({ accessory }: AccessoryCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch live inventory when dialog is open
  const { liveStock, isLoading, error, refetch } = useLocallyInventory({
    partNumber: accessory.partNumber,
    enabled: isDialogOpen,
  });
  
  return (
    <>
      {/* Card - Browse View */}
      <Card className="group bg-card shadow-sm rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:transform hover:-translate-y-2">
        {/* Image Section */}
        <div className="relative bg-muted/30 p-6 overflow-hidden">
          <img 
            src={accessory.imageUrl} 
            alt={accessory.name}
            className="h-48 w-full object-contain aspect-square transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Stock Badge (static on card) */}
          {accessory.inStock && (
            <div className="absolute top-4 left-4">
              <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 font-medium">
                In Stock
              </Badge>
            </div>
          )}
          
          {/* Mercury Logo */}
          <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
            <img src={mercuryLogo} alt="Mercury Marine" className="h-6 w-auto" />
          </div>
        </div>
        
        {/* Mercury Brand Accent */}
        <div className="h-0.5 bg-gradient-to-r from-[#003F7F] to-transparent"></div>
        
        {/* Content Section */}
        <CardContent className="p-6 space-y-4">
          {/* Product Name */}
          <h3 className="text-xl font-semibold tracking-wide text-foreground">
            {accessory.name}
          </h3>
          
          {/* Part Number */}
          {accessory.partNumber && (
            <p className="text-sm text-muted-foreground font-normal">
              Part #: {accessory.partNumber}
            </p>
          )}
          
          {/* Short Description */}
          <p className="text-sm text-muted-foreground font-normal line-clamp-2">
            {accessory.shortDescription}
          </p>
          
          {/* Pricing */}
          <div className="pt-2">
            {accessory.msrp && accessory.price && accessory.msrp > accessory.price && (
              <p className="text-sm text-muted-foreground line-through font-normal">
                ${accessory.msrp.toLocaleString()}
              </p>
            )}
            <p className="text-xl font-bold text-foreground">
              {accessory.price ? `$${accessory.price.toLocaleString()}` : 'Call for Price'}
            </p>
          </div>
          
          {/* Compatibility */}
          {accessory.compatibility && (
            <p className="text-xs text-muted-foreground italic font-normal">
              {accessory.compatibility}
            </p>
          )}
          
          {/* CTA Buttons */}
          <div className="flex gap-3 pt-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1 font-medium hover:opacity-80"
                >
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl md:text-2xl font-semibold tracking-wide">
                    {accessory.name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Image */}
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <img 
                      src={accessory.imageUrl} 
                      alt={accessory.name}
                      className="w-full h-64 object-contain"
                    />
                  </div>
                  
                  {/* Part Number & Live Stock */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {accessory.partNumber && (
                      <p className="text-sm text-muted-foreground font-normal">
                        Part #: {accessory.partNumber}
                      </p>
                    )}
                    <LiveStockBadge 
                      liveStock={liveStock}
                      isLoading={isLoading}
                      error={error}
                      fallbackInStock={accessory.inStock}
                      onRefresh={refetch}
                    />
                  </div>
                  
                  {/* Error message */}
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>Couldn't verify live inventory. Showing cached data.</span>
                    </div>
                  )}
                  
                  {/* Live Pricing */}
                  <LivePriceDisplay
                    liveStock={liveStock}
                    isLoading={isLoading}
                    staticPrice={accessory.price}
                    staticMsrp={accessory.msrp}
                  />
                  
                  {/* Last checked timestamp */}
                  {liveStock?.lastChecked && !isLoading && (
                    <p className="text-xs text-muted-foreground">
                      Inventory checked {formatTimeAgo(liveStock.lastChecked)}
                    </p>
                  )}
                  
                  <Separator />
                  
                  {/* Description */}
                  <div>
                    <h3 className="text-base font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground font-normal leading-relaxed">
                      {accessory.description}
                    </p>
                  </div>
                  
                  {/* Specifications */}
                  {accessory.specifications && accessory.specifications.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold mb-3">Specifications</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {accessory.specifications.map((spec, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground font-medium mb-1">
                              {spec.label}
                            </p>
                            <p className="text-sm font-normal">
                              {spec.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Features */}
                  {accessory.features && accessory.features.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold mb-3">Features</h3>
                      <ul className="space-y-2">
                        {accessory.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span className="text-muted-foreground font-normal">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Compatibility */}
                  {accessory.compatibility && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold mb-2">Compatibility</h3>
                      <p className="text-sm text-muted-foreground font-normal">
                        {accessory.compatibility}
                      </p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Contact CTAs */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-normal text-center">
                      Ready to order? Contact our team for availability and installation
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="font-medium"
                        asChild
                      >
                        <a href={`tel:${COMPANY_INFO.contact.phone}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Call Us
                        </a>
                      </Button>
                      <Button 
                        variant="luxuryModern"
                        asChild
                      >
                        <a href={`mailto:${COMPANY_INFO.contact.email}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Email Us
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="luxuryModern" 
              className="flex-1"
              asChild
            >
              <a href={`tel:${COMPANY_INFO.contact.phone}`}>
                Contact Us
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
