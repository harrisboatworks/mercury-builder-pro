import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, AlertTriangle, CheckCircle, Search } from 'lucide-react';

interface MotorInventoryData {
  id: string;
  model: string;
  horsepower: number;
  availability: string;
  stock_number: string | null;
  last_scraped: string | null;
  base_price: number;
  sale_price: number | null;
}

interface InventoryStats {
  total: number;
  inStock: number;
  brochure: number;
  sold: number;
  excluded: number;
  withStockNumbers: number;
  withoutStockNumbers: number;
  lastUpdate: string | null;
}

export function InventoryMonitor() {
  const [motors, setMotors] = useState<MotorInventoryData[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // Fetch motors with inventory data
      const { data: motorsData, error: motorsError } = await supabase
        .from('motor_models')
        .select('id, model, horsepower, availability, stock_number, last_scraped, base_price, sale_price')
        .order('last_scraped', { ascending: false });

      if (motorsError) throw motorsError;

      setMotors(motorsData || []);

      // Calculate stats
      const total = motorsData?.length || 0;
      const inStock = motorsData?.filter(m => m.availability === 'In Stock').length || 0;
      const brochure = motorsData?.filter(m => m.availability === 'Brochure').length || 0;
      const sold = motorsData?.filter(m => m.availability === 'Sold').length || 0;
      const excluded = motorsData?.filter(m => m.availability === 'Exclude').length || 0;
      const withStockNumbers = motorsData?.filter(m => m.stock_number).length || 0;
      const withoutStockNumbers = total - withStockNumbers;
      const lastUpdate = motorsData?.[0]?.last_scraped || null;

      setStats({
        total,
        inStock,
        brochure,
        sold,
        excluded,
        withStockNumbers,
        withoutStockNumbers,
        lastUpdate
      });
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const triggerInventoryUpdate = async () => {
    try {
      const { error } = await supabase.functions.invoke('scrape-inventory', {
        body: { trigger: 'manual-admin', force: true }
      });
      
      if (error) throw error;
      
      // Refresh data after update
      setTimeout(fetchInventoryData, 3000);
    } catch (error) {
      console.error('Error triggering inventory update:', error);
    }
  };

  const updateMotorAvailability = async (motorId: string, availability: string) => {
    try {
      const { error } = await supabase
        .from('motor_models')
        .update({ availability })
        .eq('id', motorId);
      
      if (error) throw error;
      
      // Refresh data
      fetchInventoryData();
    } catch (error) {
      console.error('Error updating motor availability:', error);
    }
  };

  const filteredMotors = motors.filter(motor => {
    const matchesSearch = motor.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motor.horsepower.toString().includes(searchTerm) ||
                         (motor.stock_number && motor.stock_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAvailability = selectedAvailability === 'all' || motor.availability === selectedAvailability;
    
    return matchesSearch && matchesAvailability;
  });

  const getAvailabilityBadgeVariant = (availability: string) => {
    switch (availability) {
      case 'In Stock': return 'default';
      case 'Brochure': return 'secondary';
      case 'Sold': return 'destructive';
      case 'Exclude': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading inventory data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Motors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.inStock || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Brochure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.brochure || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.sold || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Stock #</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.withStockNumbers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Excluded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats?.excluded || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">No Stock #</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.withoutStockNumbers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Monitor and manage motor inventory status
                {stats?.lastUpdate && (
                  <span className="block text-sm text-muted-foreground mt-1">
                    Last updated: {new Date(stats.lastUpdate).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={triggerInventoryUpdate} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Inventory
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search motors, HP, or stock number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Brochure">Brochure</option>
              <option value="Sold">Sold</option>
              <option value="Exclude">Exclude</option>
            </select>
          </div>

          {stats && stats.withoutStockNumbers > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {stats.withoutStockNumbers} motors are missing stock numbers. This may affect availability detection.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Motors List */}
      <Card>
        <CardHeader>
          <CardTitle>Motors ({filteredMotors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMotors.map((motor) => (
              <div key={motor.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{motor.model}</div>
                  <div className="text-sm text-muted-foreground">
                    {motor.horsepower}HP | ${motor.base_price.toLocaleString()}
                    {motor.sale_price && (
                      <span className="text-green-600 ml-2">
                        Sale: ${motor.sale_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {motor.stock_number && (
                    <div className="text-xs text-muted-foreground">
                      Stock: {motor.stock_number}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getAvailabilityBadgeVariant(motor.availability)}>
                    {motor.availability}
                  </Badge>
                  
                  <select
                    value={motor.availability}
                    onChange={(e) => updateMotorAvailability(motor.id, e.target.value)}
                    className="text-xs px-2 py-1 border rounded"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Brochure">Brochure</option>
                    <option value="Sold">Sold</option>
                    <option value="Exclude">Exclude</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}