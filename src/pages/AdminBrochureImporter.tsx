import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminNav from "@/components/admin/AdminNav";

interface ParsedMotor {
  model_number: string;
  description: string;
  price: number;
  section: string;
}

export default function AdminBrochureImporter() {
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedMotor[]>([]);
  const [importing, setImporting] = useState(false);

  const parseHtmlFile = async () => {
    setLoading(true);
    try {
      // Fetch the HTML file
      const response = await fetch('/motor-pricing-printable.html');
      const htmlContent = await response.text();
      
      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      const motors: ParsedMotor[] = [];
      
      // Find all tables with motor data
      const tables = doc.querySelectorAll('table');
      
      tables.forEach((table) => {
        // Get the section header before this table
        let sectionElement = table.previousElementSibling;
        while (sectionElement && !sectionElement.classList.contains('section-header')) {
          sectionElement = sectionElement.previousElementSibling;
        }
        
        const section = sectionElement?.textContent?.trim() || 'Unknown';
        
        // Parse table rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const modelNumber = cells[0].textContent?.trim() || '';
            const description = cells[1].textContent?.trim() || '';
            const priceText = cells[2].textContent?.trim() || '';
            
            // Parse price (remove $ and commas)
            const price = parseFloat(priceText.replace(/[$,]/g, '')) || 0;
            
            if (modelNumber && description && price > 0) {
              motors.push({
                model_number: modelNumber,
                description,
                price,
                section
              });
            }
          }
        });
      });
      
      setParsedData(motors);
      toast.success(`Parsed ${motors.length} motors from HTML file`);
      
    } catch (error) {
      console.error('Error parsing HTML:', error);
      toast.error('Failed to parse HTML file');
    } finally {
      setLoading(false);
    }
  };

  const importToDatabase = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to import. Parse the HTML file first.');
      return;
    }

    setImporting(true);
    try {
      // Convert to CSV-like format that the bulk-upsert function expects
      const rows = parsedData.map(motor => ({
        model_number: motor.model_number,
        model_display: motor.description,
        dealer_price: motor.price,
        msrp: motor.price * 1.4, // Add 40% markup for MSRP
        motor_type: 'Outboard',
        year: 2025,
        is_brochure: true
      }));

      // Call the bulk upsert function
      const { data, error } = await supabase.functions.invoke('bulk-upsert-brochure', {
        body: { rows }
      });

      if (error) {
        throw error;
      }

      toast.success(`Successfully imported ${data?.created || 0} new motors and updated ${data?.updated || 0} existing motors`);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import motors to database');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <AdminNav />
      
      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mercury Motor HTML Import Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={parseHtmlFile} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Parsing...' : 'Parse HTML File'}
              </Button>
              
              <Button 
                onClick={importToDatabase} 
                disabled={importing || parsedData.length === 0}
              >
                {importing ? 'Importing...' : `Import ${parsedData.length} Motors`}
              </Button>
            </div>
            
            {parsedData.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Found {parsedData.length} motors ready to import
                </div>
                
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Model #</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-right p-2">Price</th>
                        <th className="text-left p-2">Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 20).map((motor, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 font-mono text-xs">{motor.model_number}</td>
                          <td className="p-2">{motor.description}</td>
                          <td className="p-2 text-right">${motor.price.toLocaleString()}</td>
                          <td className="p-2 text-xs">{motor.section}</td>
                        </tr>
                      ))}
                      {parsedData.length > 20 && (
                        <tr>
                          <td colSpan={4} className="p-2 text-center text-muted-foreground">
                            ... and {parsedData.length - 20} more motors
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}