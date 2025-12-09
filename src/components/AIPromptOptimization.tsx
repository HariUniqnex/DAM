import { useState, useEffect } from 'react';
import {
  Sparkles, Plus, Play, Save, BookOpen, TrendingUp, Zap, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AIPrompt {
  id: string;
  name: string;
  prompt_text: string;
  prompt_type: 'optimization' | 'enhancement' | 'generation' | 'analysis';
  parameters: any;
  is_template: boolean;
  usage_count: number;
  success_rate: number | null;
  created_at: string;
}

const PROMPT_TYPES = [
  {
    value: 'optimization',
    label: 'Image Optimization',
    description: 'Optimize existing images for better quality'
  },
  {
    value: 'enhancement',
    label: 'Image Enhancement',
    description: 'Enhance colors, lighting, and details'
  },
  {
    value: 'generation',
    label: 'Content Generation',
    description: 'Generate new content or variations'
  },
  {
    value: 'analysis',
    label: 'Image Analysis',
    description: 'Analyze and extract information from images'
  }
];

const TEMPLATE_PROMPTS = [
  {
    name: 'Professional Product Photo',
    type: 'optimization',
    prompt: 'Transform this product image into a professional e-commerce photo with perfect lighting, sharp details, and clean background. Maintain the product\'s true colors and proportions.'
  },
  {
    name: 'Enhanced Colors',
    type: 'enhancement',
    prompt: 'Enhance the colors in this image to make them more vibrant and appealing while maintaining natural appearance. Improve contrast and saturation optimally.'
  },
  {
    name: 'Background Improvement',
    type: 'optimization',
    prompt: 'Improve the background of this product image. Make it cleaner and more professional while ensuring the product remains the focal point.'
  },
  {
    name: 'Lifestyle Context',
    type: 'generation',
    prompt: 'Place this product in a realistic lifestyle setting that showcases its use case. Create a natural, appealing environment that helps customers visualize the product in their space.'
  }
];

export function AIPromptOptimization() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [templates, setTemplates] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    prompt_text: '',
    prompt_type: 'optimization' as const,
    parameters: {}
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const [userPrompts, templatePrompts] = await Promise.all([
        supabase
          .from('ai_prompts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_template', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('ai_prompts')
          .select('*')
          .eq('is_template', true)
          .order('usage_count', { ascending: false })
      ]);

      if (userPrompts.data) setPrompts(userPrompts.data);
      if (templatePrompts.data) setTemplates(templatePrompts.data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('ai_prompts')
        .insert([{
          user_id: user.id,
          client_id: profile?.client_id,
          ...formData
        }]);

      if (error) throw error;

      setShowCreateForm(false);
      setFormData({
        name: '',
        prompt_text: '',
        prompt_type: 'optimization',
        parameters: {}
      });
      fetchPrompts();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUsePrompt = async (prompt: AIPrompt) => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to process');
      return;
    }

    try {
      await supabase
        .from('ai_prompts')
        .update({
          usage_count: prompt.usage_count + 1
        })
        .eq('id', prompt.id);

      alert('AI processing started. This may take a few minutes.');
      fetchPrompts();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUseTemplate = (template: typeof TEMPLATE_PROMPTS[0]) => {
    setFormData({
      name: template.name,
      prompt_text: template.prompt,
      prompt_type: template.type as any,
      parameters: {}
    });
    setShowCreateForm(true);
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
          <h1 className="text-3xl font-bold text-slate-900">AI Prompt Optimization</h1>
          <p className="text-slate-600 mt-1">Use AI to enhance and optimize your product images</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Prompt</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Create Custom Prompt</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prompt Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="My Custom Optimization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prompt Type</label>
              <select
                value={formData.prompt_type}
                onChange={(e) => setFormData({ ...formData, prompt_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {PROMPT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <p className="text-sm text-slate-500 mt-1">
                {PROMPT_TYPES.find(t => t.value === formData.prompt_type)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prompt Text</label>
              <textarea
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe how you want the AI to process your images..."
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                <span>Save Prompt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Prompt Templates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATE_PROMPTS.map((template, idx) => (
            <div
              key={idx}
              className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <h3 className="font-semibold text-slate-900 mb-2">{template.name}</h3>
              <p className="text-sm text-slate-600 mb-3">{template.prompt}</p>
              <button
                onClick={() => handleUseTemplate(template)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Prompts</h2>

          {prompts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No custom prompts yet. Create your first prompt above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{prompt.name}</h3>
                    <span className="text-xs text-slate-500 capitalize px-2 py-1 bg-slate-100 rounded">
                      {prompt.prompt_type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{prompt.prompt_text}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{prompt.usage_count} uses</span>
                      </div>
                      {prompt.success_rate && (
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3" />
                          <span>{prompt.success_rate}% success</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleUsePrompt(prompt)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      <Play className="w-3 h-3" />
                      <span>Use</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Select Images</h2>

          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-3">
              Select images to apply AI optimization
            </p>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Upload images or select from gallery</p>
              <p className="text-sm text-slate-500 mt-2">
                {selectedImages.length} image(s) selected
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
            <ol className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start space-x-2">
                <span className="font-bold">1.</span>
                <span>Select or create a prompt that describes your desired output</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold">2.</span>
                <span>Choose the images you want to optimize</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold">3.</span>
                <span>Click "Use" and let AI process your images</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold">4.</span>
                <span>Review and download the optimized results</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
