import { useState } from 'react';
import { Phone, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Accessory } from '@/lib/accessories-data';
import { COMPANY_INFO } from '@/lib/companyInfo';
import mercuryLogo from '@/assets/mercury-logo.png';

interface AccessoryCardProps {
  accessory: Accessory;
}

export function AccessoryCard({ accessory }: AccessoryCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
          
          {/* Stock Badge */}
          {accessory.inStock && (
            <div className="absolute top-4 left-4">
              <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 font-light">
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
          <h3 className="text-xl font-light tracking-wide text-foreground">
            {accessory.name}
          </h3>
          
          {/* Part Number */}
          {accessory.partNumber && (
            <p className="text-sm text-muted-foreground font-light">
              Part #: {accessory.partNumber}
            </p>
          )}
          
          {/* Short Description */}
          <p className="text-sm text-muted-foreground font-light line-clamp-2">
            {accessory.shortDescription}
          </p>
          
          {/* Pricing */}
          <div className="pt-2">
            {accessory.msrp && accessory.price && accessory.msrp > accessory.price && (
              <p className="text-base text-muted-foreground line-through font-light">
                ${accessory.msrp.toLocaleString()}
              </p>
            )}
            <p className="text-2xl font-light text-foreground">
              {accessory.price ? `$${accessory.price.toLocaleString()}` : 'Call for Price'}
            </p>
          </div>
          
          {/* Compatibility */}
          {accessory.compatibility && (
            <p className="text-xs text-muted-foreground italic font-light">
              {accessory.compatibility}
            </p>
          )}
          
          {/* CTA Buttons */}
          <div className="flex gap-3 pt-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1 font-light hover:opacity-80"
                >
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-light tracking-wide">
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
                  
                  {/* Part Number & Stock */}
                  <div className="flex items-center justify-between">
                    {accessory.partNumber && (
                      <p className="text-sm text-muted-foreground font-light">
                        Part #: {accessory.partNumber}
                      </p>
                    )}
                    {accessory.inStock && (
                      <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 font-light">
                        In Stock
                      </Badge>
                    )}
                  </div>
                  
                  {/* Pricing */}
                  <div>
                    {accessory.msrp && accessory.price && accessory.msrp > accessory.price && (
                      <p className="text-lg text-muted-foreground line-through font-light">
                        MSRP: ${accessory.msrp.toLocaleString()}
                      </p>
                    )}
                    <p className="text-3xl font-light text-foreground">
                      {accessory.price ? `$${accessory.price.toLocaleString()}` : 'Call for Price'}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-light mb-2">Description</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      {accessory.description}
                    </p>
                  </div>
                  
                  {/* Specifications */}
                  {accessory.specifications && accessory.specifications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-light mb-3">Specifications</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {accessory.specifications.map((spec, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground font-light mb-1">
                              {spec.label}
                            </p>
                            <p className="text-sm font-light">
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
                      <h3 className="text-lg font-light mb-3">Features</h3>
                      <ul className="space-y-2">
                        {accessory.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span className="text-muted-foreground font-light">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Compatibility */}
                  {accessory.compatibility && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="text-sm font-light mb-2">Compatibility</h3>
                      <p className="text-sm text-muted-foreground font-light">
                        {accessory.compatibility}
                      </p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Contact CTAs */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-light text-center">
                      Ready to order? Contact our team for availability and installation
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="font-light"
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
