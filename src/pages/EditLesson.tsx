import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SectionEditor } from '../components/SectionEditor';
import type { ProcessedLesson, LessonSection } from '../lib/types';

export function EditLesson() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<ProcessedLesson | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [level, setLevel] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [topicBackground, setTopicBackground] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('lesson_plans')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data?.processed_content) throw new Error('Lesson not found');

        const lessonContent = data.processed_content;
        setLesson(lessonContent);
        setTitle(lessonContent.title);
        setDuration(lessonContent.duration);
        setLevel(lessonContent.level || '');
        setObjectives(lessonContent.objectives);
        setMaterials(lessonContent.materials);
        setSections(lessonContent.sections);
        setTopicBackground(lessonContent.topic_background || '');
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const handleSave = async () => {
    if (!lesson || !id) return;

    setSaving(true);
    setError(null);

    try {
      const updatedLesson = {
        ...lesson,
        title,
        duration,
        level,
        objectives,
        materials,
        sections,
        topic_background: topicBackground
      };

      const { error: updateError } = await supabase
        .from('lesson_plans')
        .update({
          title,
          level,
          processed_content: updatedLesson
        })
        .eq('id', id);

      if (updateError) throw updateError;
      navigate(`/planner/${id}`);
    } catch (err) {
      console.error('Error updating lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lesson');
      setSaving(false);
    }
  };

  const handleAddObjective = () => {
    setObjectives([...objectives, '']);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    setMaterials([...materials, '']);
  };

  const handleMaterialChange = (index: number, value: string) => {
    const newMaterials = [...materials];
    newMaterials[index] = value;
    setMaterials(newMaterials);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleAddSection = () => {
    const newSection: LessonSection = {
      id: crypto.randomUUID(),
      title: '',
      duration: '15 minutes',
      content: '',
      activities: [],
      assessment: ''
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (index: number, updatedSection: LessonSection) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Lesson Plan</h1>

      <div className="space-y-6">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
        />

        <div className="space-y-2">
          <label htmlFor="level" className="block text-sm font-medium text-gray-700">
            Lesson Level
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select grade level</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>

        <Input
          label="Duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={saving}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Learning Objectives</h2>
            <Button
              onClick={handleAddObjective}
              variant="outline"
              size="sm"
              disabled={saving}
            >
              Add Objective
            </Button>
          </div>
          {objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={objective}
                onChange={(e) => handleObjectiveChange(index, e.target.value)}
                disabled={saving}
                placeholder={`Objective ${index + 1}`}
              />
              <Button
                onClick={() => handleRemoveObjective(index)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                disabled={saving}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Topic Background</h2>
          </div>
          <textarea
            value={topicBackground}
            onChange={(e) => setTopicBackground(e.target.value)}
            placeholder="Enter background information about the topic, tailored to the student level"
            rows={6}
            disabled={saving}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Materials Needed</h2>
            <Button
              onClick={handleAddMaterial}
              variant="outline"
              size="sm"
              disabled={saving}
            >
              Add Material
            </Button>
          </div>
          {materials.map((material, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={material}
                onChange={(e) => handleMaterialChange(index, e.target.value)}
                disabled={saving}
                placeholder={`Material ${index + 1}`}
              />
              <Button
                onClick={() => handleRemoveMaterial(index)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                disabled={saving}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Lesson Sections</h2>
            <Button
              onClick={handleAddSection}
              variant="outline"
              size="sm"
              disabled={saving}
            >
              Add Section
            </Button>
          </div>
          {sections.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              onUpdate={(updatedSection) => handleUpdateSection(index, updatedSection)}
              onDelete={() => handleRemoveSection(index)}
              isProcessing={saving}
            />
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/planner/${id}`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}