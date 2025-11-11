// src/components/admin/FinancingAdmin.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash, TrendingUp, Calendar, Upload, X } from "lucide-react";
import { format } from "date-fns";
import AdminNav from "@/components/admin/AdminNav";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";


interface FinancingOption {
  id: string;
  name: string;
  rate: number;
  term_months: number;
  min_amount: number;
  is_promo: boolean;
  promo_text?: string;
  promo_end_date?: string;
  is_active: boolean;
  display_order: number;
  image_url?: string;
  image_alt_text?: string;
}

export default function FinancingAdmin() {
  const [options, setOptions] = useState<FinancingOption[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
const [formData, setFormData] = useState<Partial<FinancingOption>>({
  name: '',
  rate: 7.99,
  term_months: 60,
  min_amount: 5000,
  is_promo: false,
  promo_text: '',
  promo_end_date: '',
  is_active: true,
  display_order: 0,
  image_url: '',
  image_alt_text: ''
});
const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    loadFinancingOptions();
  }, []);

  const loadFinancingOptions = async () => {
    const { data, error } = await (supabase as any)
      .from('financing_options')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast({
        title: "Error loading financing options",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setOptions(data || []);
    }
};
  
  // Upload promo image to Supabase storage and return public URL
  const handleImageUpload = async (file: File) => {
    const fileName = `financing/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('promo-images')
      .upload(fileName, file);

    if (error) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('promo-images')
      .getPublicUrl(fileName);

    return publicData.publicUrl as string;
  };

const handleSave = async () => {
    if (!formData.name || !formData.rate || !formData.term_months) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    let imageUrl = formData.image_url || "";

    if (imageFile) {
      const uploadedUrl = await handleImageUpload(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const saveData = {
      ...formData,
      image_url: imageUrl,
    } as Partial<FinancingOption>;

    if (editingId) {
      // Update existing
      const { error } = await (supabase as any)
        .from('financing_options')
        .update({
          ...saveData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) {
        toast({
          title: "Error updating financing option",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Financing option updated",
        });
        setEditingId(null);
        setIsAddingNew(false);
      }
    } else {
      // Create new
      const { error } = await (supabase as any)
        .from('financing_options')
        .insert([saveData]);

      if (error) {
        toast({
          title: "Error creating financing option",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Financing option created",
        });
        setIsAddingNew(false);
      }
    }

    setFormData({
      name: '',
      rate: 7.99,
      term_months: 60,
      min_amount: 5000,
      is_promo: false,
      promo_text: '',
      promo_end_date: '',
      is_active: true,
      display_order: 0,
      image_url: '',
      image_alt_text: '',
    });
    setImageFile(null);
    setImagePreview('');
    loadFinancingOptions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this financing option?')) return;

    const { error } = await (supabase as any)
      .from('financing_options')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting financing option",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Financing option deleted"
      });
      loadFinancingOptions();
    }
  };

const handleEdit = (option: FinancingOption) => {
    setFormData(option);
    setEditingId(option.id);
    setIsAddingNew(true);
    setImageFile(null);
    setImagePreview(option.image_url || '');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminNav />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Financing Options</h1>
        <button
onClick={() => {
            setIsAddingNew(true);
            setEditingId(null);
            setImageFile(null);
            setImagePreview('');
            setFormData({
              name: '',
              rate: 7.99,
              term_months: 60,
              min_amount: 5000,
              is_promo: false,
              promo_text: '',
              promo_end_date: '',
              is_active: true,
              display_order: options.length,
              image_url: '',
              image_alt_text: ''
            });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Financing Option
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAddingNew && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit' : 'Add'} Financing Option
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Mercury Summer Promo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Rate (%) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="4.99"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Term (months) *</label>
              <select
                value={formData.term_months}
                onChange={(e) => setFormData({ ...formData, term_months: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
                <option value={36}>36 months</option>
                <option value={48}>48 months</option>
                <option value={60}>60 months</option>
                <option value={72}>72 months</option>
                <option value={84}>84 months</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Amount *</label>
              <input
                type="number"
                step="100"
                value={formData.min_amount}
                onChange={(e) => setFormData({ ...formData, min_amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="5000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only show this option for quotes above this amount
              </p>
            </div>
            
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formData.is_promo}
                  onChange={(e) => setFormData({ ...formData, is_promo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="font-medium">This is a promotional rate</span>
              </label>
            </div>
            
{formData.is_promo && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Promo Text</label>
                  <input
                    type="text"
                    value={formData.promo_text}
                    onChange={(e) => setFormData({ ...formData, promo_text: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Special Mercury financing!"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Promo End Date</label>
                  <input
                    type="date"
                    value={(formData.promo_end_date || '').toString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, promo_end_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Promo Image (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {(formData.image_url || imagePreview) ? (
                      <div className="relative">
                        <img 
                          src={imagePreview || (formData.image_url || '')} 
                          alt={formData.image_alt_text || 'Promo image'}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview('');
                            setFormData({ ...formData, image_url: '', image_alt_text: '' });
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-gray-50">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload promo image</span>
                        <span className="text-xs text-gray-500 mt-1">Recommended: 1200x400px</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setImageFile(file);
                              setImagePreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use official Mercury/manufacturer promo graphics or professional banners
                  </p>
                </div>
                
                {(formData.image_url || imagePreview) && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Image Alt Text</label>
                    <input
                      type="text"
                      value={formData.image_alt_text || ''}
                      onChange={(e) => setFormData({ ...formData, image_alt_text: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Mercury Marine 4.9% financing promotion"
                    />
                  </div>
                )}
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="font-medium">Active</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save
            </button>
            <button
onClick={() => {
                setIsAddingNew(false);
                setEditingId(null);
                setImageFile(null);
                setImagePreview('');
                setFormData({
                  name: '',
                  rate: 7.99,
                  term_months: 60,
                  min_amount: 5000,
                  is_promo: false,
                  promo_text: '',
                  promo_end_date: '',
                  is_active: true,
                  display_order: 0,
                  image_url: '',
                  image_alt_text: ''
                });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Financing Options List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {options.length === 0 && !isAddingNew ? (
          <EmptyState
            icon={<TrendingUp className="w-16 h-16" />}
            title="No Financing Options Yet"
            description="Create your first financing option to get started. You can add promotional rates, standard financing, and more."
            action={
              <Button
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingId(null);
                  setImageFile(null);
                  setImagePreview('');
                  setFormData({
                    name: '',
                    rate: 7.99,
                    term_months: 60,
                    min_amount: 5000,
                    is_promo: false,
                    promo_text: '',
                    promo_end_date: '',
                    is_active: true,
                    display_order: 0,
                    image_url: '',
                    image_alt_text: ''
                  });
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Option
              </Button>
            }
          />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Rate</th>
                <th className="px-4 py-3 text-left">Term</th>
                <th className="px-4 py-3 text-left">Min Amount</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.promo_text && (
                      <div className="text-sm text-gray-500">{option.promo_text}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-bold">{option.rate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">{option.term_months} months</td>
                <td className="px-4 py-3">${option.min_amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {option.is_promo ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                      PROMO
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      Standard
                    </span>
                  )}
                  {option.promo_end_date && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        Ends {format(new Date(option.promo_end_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold
                    ${option.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                    {option.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(option)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(option.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
