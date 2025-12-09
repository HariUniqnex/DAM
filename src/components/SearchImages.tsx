import { useState } from 'react';
import {
  Search, Filter, Image as ImageIcon, SlidersHorizontal, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SearchFilters {
  sku?: string;
  mpn?: string;
  category_id?: string;
  brand_id?: string;
  query?: string;
}

export function SearchImages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true);
    if (data) setCategories(data);
  };

  const fetchBrands = async () => {
    const { data } = await supabase
      .from('brands')
      .select('id, name')
      .eq('is_active', true);
    if (data) setBrands(data);
  };

  useState(() => {
    fetchCategories();
    fetchBrands();
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('images')
        .select('*, category:categories(name), brand:brands(name)');

      if (searchQuery) {
        query = query.or(`sku.ilike.%${searchQuery}%,mpn.ilike.%${searchQuery}%`);
      }

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.brand_id) {
        query = query.eq('brand_id', filters.brand_id);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setResults([]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Search Images</h1>
        <p className="text-slate-600 mt-1">Find images by SKU, MPN, category, or brand</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by SKU or MPN..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
          </button>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                value={filters.category_id || ''}
                onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Brand</label>
              <select
                value={filters.brand_id || ''}
                onChange={(e) => setFilters({ ...filters, brand_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Results ({results.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No results found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((image) => (
              <div
                key={image.id}
                className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
              >
                <div className="aspect-square bg-slate-100">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.sku || 'Product image'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  {image.sku && (
                    <p className="text-sm font-medium text-slate-900 truncate">
                      SKU: {image.sku}
                    </p>
                  )}
                  {image.mpn && (
                    <p className="text-xs text-slate-600 truncate">
                      MPN: {image.mpn}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {image.category && (
                      <span className="text-xs text-slate-500 truncate">
                        {image.category.name}
                      </span>
                    )}
                    {image.brand && (
                      <span className="text-xs text-slate-500 truncate">
                        {image.brand.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
