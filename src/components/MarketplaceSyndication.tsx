import { useState, useEffect } from 'react';
import {
  Grid3x3, Minimize2, Video, Eraser, Edit3, Play, CheckCircle2, Clock, XCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Operation {
  id: string;
  operation_type: string;
  status: string;
  input_images: any[];
  output_images: any[];
  parameters: any;
  created_at: string;
  completed_at: string | null;
}

const OPERATION_TYPES = [
  {
    id: 'infographic',
    label: 'Infographics Creation',
    description: 'Create engaging infographics from product images',
    icon: Grid3x3,
    color: 'blue'
  },
  {
    id: 'resize',
    label: 'Bulk Resizing',
    description: 'Resize multiple images to specific dimensions',
    icon: Minimize2,
    color: 'green'
  },
  {
    id: '360-spin',
    label: '360° Product Spin',
    description: 'Generate 360-degree product videos',
    icon: Video,
    color: 'purple'
  },
  {
    id: 'bg-remove',
    label: 'Background Cleaning',
    description: 'Remove backgrounds from multiple images',
    icon: Eraser,
    color: 'orange'
  },
  {
    id: 'bulk-edit',
    label: 'Bulk Editing',
    description: 'Apply edits to multiple images at once',
    icon: Edit3,
    color: 'pink'
  }
];

export function MarketplaceSyndication() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState<any>({});

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('marketplace_operations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOperations(data || []);
    } catch (error) {
      console.error('Error fetching operations:', error);
    }
  };

  const handleStartOperation = async () => {
    if (!selectedOperation || selectedImages.length === 0) {
      alert('Please select an operation type and at least one image');
      return;
    }

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('marketplace_operations')
        .insert([{
          user_id: user.id,
          client_id: profile?.client_id,
          operation_type: selectedOperation,
          status: 'pending',
          input_images: selectedImages,
          parameters
        }]);

      if (error) throw error;

      setSelectedOperation('');
      setSelectedImages([]);
      setParameters({});
      fetchOperations();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'processing':
        return RefreshCw;
      case 'failed':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Marketplace Syndication</h1>
        <p className="text-slate-600 mt-1">Bulk operations for marketplace image preparation</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Select Operation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OPERATION_TYPES.map((opType) => {
                const Icon = opType.icon;
                const isSelected = selectedOperation === opType.id;

                return (
                  <button
                    key={opType.id}
                    onClick={() => setSelectedOperation(opType.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-${opType.color}-100`}>
                        <Icon className={`w-5 h-5 text-${opType.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900">{opType.label}</h3>
                        <p className="text-sm text-slate-600 mt-1">{opType.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedOperation === 'resize' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Resize Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Width (px)</label>
                  <input
                    type="number"
                    value={parameters.width || ''}
                    onChange={(e) => setParameters({ ...parameters, width: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1920"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Height (px)</label>
                  <input
                    type="number"
                    value={parameters.height || ''}
                    onChange={(e) => setParameters({ ...parameters, height: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1080"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedOperation === 'infographic' && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Infographic Parameters</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Template</label>
                  <select
                    value={parameters.template || ''}
                    onChange={(e) => setParameters({ ...parameters, template: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select template</option>
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Include Specs</label>
                  <input
                    type="checkbox"
                    checked={parameters.includeSpecs || false}
                    onChange={(e) => setParameters({ ...parameters, includeSpecs: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Selected Images ({selectedImages.length})
              </h3>
              <button
                onClick={() => setSelectedImages([])}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Clear All
              </button>
            </div>

            {selectedImages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No images selected. Upload and select images to process.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {selectedImages.map((imageId, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-slate-100 rounded-lg border border-slate-200"
                  >
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      Image {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleStartOperation}
              disabled={loading || !selectedOperation || selectedImages.length === 0}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Operation</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Operations</h2>
            <div className="space-y-3">
              {operations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No operations yet</p>
                </div>
              ) : (
                operations.slice(0, 10).map((operation) => {
                  const StatusIcon = getStatusIcon(operation.status);
                  const opType = OPERATION_TYPES.find(t => t.id === operation.operation_type);

                  return (
                    <div
                      key={operation.id}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900">
                          {opType?.label || operation.operation_type}
                        </span>
                        <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(operation.status)}`}>
                          <StatusIcon className={`w-3 h-3 ${operation.status === 'processing' ? 'animate-spin' : ''}`} />
                          <span className="capitalize">{operation.status}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {operation.input_images?.length || 0} images
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(operation.created_at).toLocaleString()}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
