import { useState, useEffect } from 'react';
import {
  Tag, Plus, Edit2, Save, X, Gift, Percent, Star, TrendingUp, Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PromotionalTag {
  id: string;
  name: string;
  tag_type: 'gift' | 'discount' | 'new' | 'sale' | 'featured';
  discount_percentage: number | null;
  applicable_to: 'all' | 'category' | 'brand' | 'product';
  scope_id: string | null;
  valid_from: string | null;
  valid_until: string | null;
  badge_color: string;
  badge_text: string | null;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

const TAG_TYPES = [
  { value: 'gift', label: 'Gift', icon: Gift, color: '#10B981' },
  { value: 'discount', label: 'Discount', icon: Percent, color: '#EF4444' },
  { value: 'new', label: 'New Arrival', icon: Star, color: '#3B82F6' },
  { value: 'sale', label: 'Sale', icon: TrendingUp, color: '#F59E0B' },
  { value: 'featured', label: 'Featured', icon: Star, color: '#8B5CF6' }
];

export function PromotionalTags() {
  const [tags, setTags] = useState<PromotionalTag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    tag_type: 'discount' as const,
    discount_percentage: 0,
    applicable_to: 'all' as const,
    scope_id: null as string | null,
    valid_from: '',
    valid_until: '',
    badge_color: '#EF4444',
    badge_text: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle();

      const [tagsData, categoriesData, brandsData] = await Promise.all([
        supabase
          .from('promotional_tags')
          .select('*')
          .eq('client_id', profile?.client_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name')
          .eq('client_id', profile?.client_id),
        supabase
          .from('brands')
          .select('id, name')
          .eq('client_id', profile?.client_id)
      ]);

      if (tagsData.data) setTags(tagsData.data);
      if (categoriesData.data) setCategories(categoriesData.data);
      if (brandsData.data) setBrands(brandsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle();

      const tagData = {
        ...formData,
        client_id: profile?.client_id,
        discount_percentage: formData.tag_type === 'discount' ? formData.discount_percentage : null
      };

      if (editingTag) {
        const { error } = await supabase
          .from('promotional_tags')
          .update(tagData)
          .eq('id', editingTag);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotional_tags')
          .insert([tagData]);

        if (error) throw error;
      }

      handleCancel();
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (tag: PromotionalTag) => {
    setFormData({
      name: tag.name,
      tag_type: tag.tag_type,
      discount_percentage: tag.discount_percentage || 0,
      applicable_to: tag.applicable_to,
      scope_id: tag.scope_id,
      valid_from: tag.valid_from ? tag.valid_from.split('T')[0] : '',
      valid_until: tag.valid_until ? tag.valid_until.split('T')[0] : '',
      badge_color: tag.badge_color,
      badge_text: tag.badge_text || '',
      is_active: tag.is_active
    });
    setEditingTag(tag.id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingTag(null);
    setFormData({
      name: '',
      tag_type: 'discount',
      discount_percentage: 0,
      applicable_to: 'all',
      scope_id: null,
      valid_from: '',
      valid_until: '',
      badge_color: '#EF4444',
      badge_text: '',
      is_active: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Promotional Tags</h1>
          <p className="text-slate-600 mt-1">Manage discounts, gift tags, and promotional badges</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Tag</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {editingTag ? 'Edit' : 'Create'} Promotional Tag
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tag Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Summer Sale 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tag Type</label>
                <select
                  value={formData.tag_type}
                  onChange={(e) => setFormData({ ...formData, tag_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {TAG_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {formData.tag_type === 'discount' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <Percent className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Apply To</label>
                <select
                  value={formData.applicable_to}
                  onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value as any, scope_id: null })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Products</option>
                  <option value="category">Specific Category</option>
                  <option value="brand">Specific Brand</option>
                </select>
              </div>

              {formData.applicable_to === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={formData.scope_id || ''}
                    onChange={(e) => setFormData({ ...formData, scope_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.applicable_to === 'brand' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Brand</label>
                  <select
                    value={formData.scope_id || ''}
                    onChange={(e) => setFormData({ ...formData, scope_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Valid From</label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Valid Until</label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Badge Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={formData.badge_color}
                    onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                    className="h-10 w-20 border border-slate-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.badge_color}
                    onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Badge Text</label>
                <input
                  type="text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="50% OFF"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                Active
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                <span>{editingTag ? 'Update' : 'Create'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tags.map((tag) => {
          const tagType = TAG_TYPES.find(t => t.value === tag.tag_type);
          const Icon = tagType?.icon || Tag;

          return (
            <div
              key={tag.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: tag.badge_color + '20' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: tag.badge_color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{tag.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{tag.tag_type}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(tag)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {tag.discount_percentage && (
                <div className="mb-3">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: tag.badge_color,
                      color: '#fff'
                    }}
                  >
                    {tag.badge_text || `${tag.discount_percentage}% OFF`}
                  </span>
                </div>
              )}

              <div className="space-y-2 text-sm text-slate-600">
                <div>
                  <span className="font-medium">Applies to: </span>
                  <span className="capitalize">{tag.applicable_to}</span>
                </div>

                {(tag.valid_from || tag.valid_until) && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {tag.valid_from && new Date(tag.valid_from).toLocaleDateString()}
                      {tag.valid_from && tag.valid_until && ' - '}
                      {tag.valid_until && new Date(tag.valid_until).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      tag.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tag.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tags.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No promotional tags yet</h3>
          <p className="text-slate-600 mb-4">Create your first promotional tag to boost sales</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add Tag</span>
          </button>
        </div>
      )}
    </div>
  );
}
