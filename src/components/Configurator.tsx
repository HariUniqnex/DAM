import { useState, useEffect } from 'react';
import { Palette, Layers, DollarSign, Save, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface StainOption {
  id: string;
  name: string;
  color_hex: string;
  category: string | null;
}

export function Configurator() {
  const [stains, setStains] = useState<StainOption[]>([]);
  const [selectedStain, setSelectedStain] = useState<string>('');
  const [preserveGrain, setPreserveGrain] = useState(0.9);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [jobResult, setJobResult] = useState<any>(null);

  useEffect(() => {
    loadStains();
  }, []);

  const loadStains = async () => {
    try {
      const data = await api.getStains();
      setStains(data);
      if (data.length > 0) {
        setSelectedStain(data[0].color_hex);
      }
    } catch (error) {
      console.error('Failed to load stains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyStain = async () => {
    setProcessing(true);
    setJobResult(null);

    try {
      const job = await api.createStainJob('demo-upload-id', selectedStain, {
        preserveGrain,
        strength: 0.9
      });
      setJobResult(job);
    } catch (error: any) {
      console.error('Failed to create stain job:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Component Configurator</h2>
        <p className="text-slate-600 mb-6">
          Customize your furniture by selecting wood stains, fabrics, and components.
        </p>

        <div className="space-y-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="w-5 h-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Wood Stain</h3>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {stains.map((stain) => (
                <button
                  key={stain.id}
                  onClick={() => setSelectedStain(stain.color_hex)}
                  className={`group relative aspect-square rounded-lg overflow-hidden transition-all ${
                    selectedStain === stain.color_hex
                      ? 'ring-2 ring-blue-500 ring-offset-2 scale-105'
                      : 'hover:scale-105'
                  }`}
                >
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: stain.color_hex }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">{stain.name}</p>
                    </div>
                  </div>
                  {selectedStain === stain.color_hex && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Preserve Grain: {(preserveGrain * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={preserveGrain}
                onChange={(e) => setPreserveGrain(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>More Color</span>
                <span>More Grain</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Layers className="w-5 h-5 text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Components</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-2">Legs</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Tapered Legs (Default)</option>
                  <option>Straight Legs (+$50)</option>
                  <option>Hairpin Legs (+$75)</option>
                </select>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-2">Fabric</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Linen Beige (Default)</option>
                  <option>Velvet Navy (+$100)</option>
                  <option>Leather Brown (+$200)</option>
                </select>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-2">Cushion</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Medium Firm (Default)</option>
                  <option>Firm (+$25)</option>
                  <option>Plush (+$25)</option>
                </select>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-2">Hardware</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Brushed Nickel (Default)</option>
                  <option>Brass (+$30)</option>
                  <option>Black Matte (+$30)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-slate-700" />
                <span className="text-lg font-semibold text-slate-900">Total Price</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">$1,299</span>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={handleApplyStain}
                disabled={processing}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Palette className="w-5 h-5" />
                    <span>Apply Stain</span>
                  </>
                )}
              </button>

              <button className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2">
                <Save className="w-5 h-5" />
                <span>Save Configuration</span>
              </button>
            </div>

            {jobResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  Job created successfully! Job ID: {jobResult.jobId}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
