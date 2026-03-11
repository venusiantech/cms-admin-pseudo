'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { FileText, Plus, Edit2, Trash2, Type, FileIcon, Image } from 'lucide-react';

type PromptType = 'TITLE' | 'CONTENT' | 'IMAGE';

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [filter, setFilter] = useState<PromptType | 'ALL'>('ALL');

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      const response = await adminAPI.getAllPrompts();
      return response.data;
    },
  });

  const filteredPrompts = prompts?.filter((p: any) => 
    filter === 'ALL' ? true : p.promptType === filter
  );

  const handleEdit = (prompt: any) => {
    setEditingPrompt(prompt);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingPrompt(null);
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI Prompts Manager</h1>
          <p className="text-gray-600 mt-1">
            Manage prompts for AI content generation
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Prompt
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'TITLE', 'CONTENT', 'IMAGE'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as PromptType | 'ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === type
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Prompts Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading prompts...</div>
      ) : filteredPrompts && filteredPrompts.length > 0 ? (
        <div className="grid gap-4">
          {filteredPrompts.map((prompt: any) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={() => handleEdit(prompt)}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No prompts found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'ALL'
              ? 'Create your first AI prompt'
              : `No ${filter} prompts found`}
          </p>
          <button onClick={handleAdd} className="btn-primary">
            Add First Prompt
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <PromptModal
          prompt={editingPrompt}
          onClose={() => {
            setShowModal(false);
            setEditingPrompt(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['prompts'] });
            setShowModal(false);
            setEditingPrompt(null);
          }}
        />
      )}
    </div>
  );
}

function PromptCard({ prompt, onEdit }: { prompt: any; onEdit: () => void }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => adminAPI.deletePrompt(prompt.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });

  const getIcon = () => {
    switch (prompt.promptType) {
      case 'TITLE':
        return <Type size={20} />;
      case 'CONTENT':
        return <FileIcon size={20} />;
      case 'IMAGE':
        return <Image size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getColor = () => {
    switch (prompt.promptType) {
      case 'TITLE':
        return 'bg-blue-100 text-blue-700';
      case 'CONTENT':
        return 'bg-green-100 text-green-700';
      case 'IMAGE':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex gap-4 flex-1">
          <div className={`p-3 rounded-lg ${getColor()}`}>
            {getIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{prompt.promptKey}</h3>
              <span className={`badge ${getColor()}`}>
                {prompt.promptType}
              </span>
              <span className="badge bg-gray-100 text-gray-700">
                {prompt.templateKey}
              </span>
            </div>
            <p className="text-gray-700 mb-2">{prompt.promptText}</p>
            <p className="text-xs text-gray-500">
              Last updated: {new Date(prompt.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-primary-600 hover:bg-primary-50 p-2 rounded"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this prompt?')) {
                deleteMutation.mutate();
              }
            }}
            className="text-red-600 hover:bg-red-50 p-2 rounded"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PromptModal({
  prompt,
  onClose,
  onSuccess,
}: {
  prompt: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    promptKey: prompt?.promptKey || '',
    promptText: prompt?.promptText || '',
    promptType: prompt?.promptType || 'CONTENT',
    templateKey: prompt?.templateKey || 'templateA',
  });

  const mutation = useMutation({
    mutationFn: () =>
      prompt
        ? adminAPI.updatePrompt(prompt.id, {
            promptText: formData.promptText,
            promptType: formData.promptType as 'TEXT' | 'IMAGE',
          })
        : adminAPI.createPrompt({
            promptKey: formData.promptKey,
            promptText: formData.promptText,
            promptType: formData.promptType === 'IMAGE' ? 'IMAGE' : 'TEXT',
            templateKey: formData.templateKey,
          }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {prompt ? 'Edit Prompt' : 'Create New Prompt'}
        </h2>

        <div className="space-y-4">
          {/* Prompt Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Prompt Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['TITLE', 'CONTENT', 'IMAGE'].map((type) => (
                <label
                  key={type}
                  className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.promptType === type
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="promptType"
                    value={type}
                    checked={formData.promptType === type}
                    onChange={(e) =>
                      setFormData({ ...formData, promptType: e.target.value })
                    }
                    className="sr-only"
                  />
                  {type === 'TITLE' && <Type size={20} />}
                  {type === 'CONTENT' && <FileIcon size={20} />}
                  {type === 'IMAGE' && <Image size={20} />}
                  <span className="font-medium">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Prompt Key */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Prompt Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.promptKey}
              onChange={(e) =>
                setFormData({ ...formData, promptKey: e.target.value })
              }
              className="input-field"
              placeholder="e.g., hero_title_templateA"
              disabled={!!prompt}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier for this prompt (cannot be changed after creation)
            </p>
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Template <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.templateKey}
              onChange={(e) =>
                setFormData({ ...formData, templateKey: e.target.value })
              }
              className="input-field"
              disabled={!!prompt}
              required
            >
              <option value="templateA">Template A (Modern)</option>
              <option value="templateB">Template B (Minimal)</option>
            </select>
          </div>

          {/* Prompt Text */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Prompt Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.promptText}
              onChange={(e) =>
                setFormData({ ...formData, promptText: e.target.value })
              }
              className="input-field min-h-[150px]"
              placeholder={
                formData.promptType === 'TITLE'
                  ? 'Generate a compelling, action-oriented title...'
                  : formData.promptType === 'CONTENT'
                  ? 'Generate comprehensive, well-researched content...'
                  : 'Generate a high-quality, professional image...'
              }
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.promptType === 'TITLE' &&
                'This will be sent to the Title Generator API'}
              {formData.promptType === 'CONTENT' &&
                'This will be sent to the Article Generator API'}
              {formData.promptType === 'IMAGE' &&
                'This will be sent to the Image Generator API'}
            </p>
          </div>

          {/* Example Usage */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">
              💡 Example Usage
            </p>
            <p className="text-xs text-blue-700">
              {formData.promptType === 'TITLE' &&
                'Best for: Hero headings, section titles, call-to-action text'}
              {formData.promptType === 'CONTENT' &&
                'Best for: Main content sections, feature descriptions, about text'}
              {formData.promptType === 'IMAGE' &&
                'Best for: Hero images, feature visuals, background images'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              !formData.promptKey ||
              !formData.promptText
            }
            className="btn-primary flex-1"
          >
            {mutation.isPending
              ? 'Saving...'
              : prompt
              ? 'Update Prompt'
              : 'Create Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}

