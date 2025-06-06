import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SectionEditor } from "../components/SectionEditor";
import type { ProcessedLesson, LessonSection } from "../lib/types";
import {
  aiAnalyzeLesson,
  generateSuccessCriteria,
  improveLearningIntentions,
} from "../lib/aiService";
import { Sparkles, Loader2, CheckSquare, RefreshCw } from "lucide-react";

export function EditLesson() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<ProcessedLesson | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [topicBackground, setTopicBackground] = useState("");
  const [successCriteria, setSuccessCriteria] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingBackground, setGeneratingBackground] = useState(false);
  const [backgroundMessage, setBackgroundMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [generatingCriteria, setGeneratingCriteria] = useState(false);
  const [criteriaMessage, setCriteriaMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [improvingIntentions, setImprovingIntentions] = useState(false);
  const [intentionsMessage, setIntentionsMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;

      try {
        const { data, error: fetchError } = await supabase
          .from("lesson_plans")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;
        if (!data?.processed_content) throw new Error("Lesson not found");

        const lessonContent = data.processed_content;
        setLesson(lessonContent);
        setTitle(lessonContent.title);
        setDuration(lessonContent.duration);
        setLevel(lessonContent.level || "");
        setObjectives(lessonContent.objectives);
        setMaterials(lessonContent.materials);
        setSections(lessonContent.sections);
        setTopicBackground(lessonContent.topic_background || "");
        setSuccessCriteria(lessonContent.success_criteria || []);
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson");
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
        topic_background: topicBackground,
        success_criteria: successCriteria,
      };

      const { error: updateError } = await supabase
        .from("lesson_plans")
        .update({
          title,
          level,
          processed_content: updatedLesson,
        })
        .eq("id", id);

      if (updateError) throw updateError;
      navigate(`/planner/${id}`);
    } catch (err) {
      console.error("Error updating lesson:", err);
      setError(err instanceof Error ? err.message : "Failed to update lesson");
      setSaving(false);
    }
  };

  const handleGenerateBackground = async () => {
    if (!lesson || !level) {
      setBackgroundMessage({
        text: "Please select a grade level before generating background information",
        type: "error",
      });
      return;
    }

    setGeneratingBackground(true);
    setBackgroundMessage(null);

    try {
      // Construct a simple text representation of the lesson content
      const lessonContent = `
        Title: ${title}
        Duration: ${duration}
        Level: ${level}
        Objectives: ${objectives.join("; ")}
        Materials: ${materials.join("; ")}
        Sections: ${sections.map((s) => `${s.title}: ${s.content}`).join("\n")}
      `;

      // Use the AI service to generate background information
      const result = await aiAnalyzeLesson(lessonContent, level);

      if (result && result.topic_background) {
        setTopicBackground(result.topic_background);
        setBackgroundMessage({
          text: "Background information generated successfully",
          type: "success",
        });
      } else {
        throw new Error("Failed to generate background information");
      }
    } catch (err) {
      console.error("Error generating background:", err);
      setBackgroundMessage({
        text:
          err instanceof Error
            ? err.message
            : "Failed to generate background information",
        type: "error",
      });
    } finally {
      setGeneratingBackground(false);
      // Clear success message after 5 seconds
      if (backgroundMessage?.type === "success") {
        setTimeout(() => {
          setBackgroundMessage(null);
        }, 5000);
      }
    }
  };

  const handleGenerateSuccessCriteria = async () => {
    if (objectives.length === 0) {
      setCriteriaMessage({
        text: "Please add learning objectives before generating success criteria",
        type: "error",
      });
      return;
    }

    setGeneratingCriteria(true);
    setCriteriaMessage(null);

    try {
      const criteria = await generateSuccessCriteria(objectives, level);

      if (criteria && criteria.length > 0) {
        setSuccessCriteria(criteria);
        setCriteriaMessage({
          text: "Success criteria generated successfully",
          type: "success",
        });
      } else {
        throw new Error("Failed to generate success criteria");
      }
    } catch (err) {
      console.error("Error generating success criteria:", err);
      setCriteriaMessage({
        text:
          err instanceof Error
            ? err.message
            : "Failed to generate success criteria",
        type: "error",
      });
    } finally {
      setGeneratingCriteria(false);
      // Clear success message after 5 seconds
      if (criteriaMessage?.type === "success") {
        setTimeout(() => {
          setCriteriaMessage(null);
        }, 5000);
      }
    }
  };

  const handleImproveLearningIntentions = async () => {
    if (objectives.length === 0) {
      setIntentionsMessage({
        text: "Please add learning objectives before improving them",
        type: "error",
      });
      return;
    }

    setImprovingIntentions(true);
    setIntentionsMessage(null);

    try {
      const improvedObjectives = await improveLearningIntentions(
        objectives,
        level
      );

      if (improvedObjectives && improvedObjectives.length > 0) {
        setObjectives(improvedObjectives);
        setIntentionsMessage({
          text: "Learning intentions improved successfully",
          type: "success",
        });
      } else {
        throw new Error("Failed to improve learning intentions");
      }
    } catch (err) {
      console.error("Error improving learning intentions:", err);
      setIntentionsMessage({
        text:
          err instanceof Error
            ? err.message
            : "Failed to improve learning intentions",
        type: "error",
      });
    } finally {
      setImprovingIntentions(false);
      // Clear success message after 5 seconds
      setTimeout(() => {
        setIntentionsMessage(null);
      }, 5000);
    }
  };

  const handleAddObjective = () => {
    setObjectives([...objectives, ""]);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleAddSuccessCriteria = () => {
    setSuccessCriteria([...successCriteria, ""]);
  };

  const handleSuccessCriteriaChange = (index: number, value: string) => {
    const newCriteria = [...successCriteria];
    newCriteria[index] = value;
    setSuccessCriteria(newCriteria);
  };

  const handleRemoveSuccessCriteria = (index: number) => {
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    setMaterials([...materials, ""]);
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
      title: "",
      duration: "15 minutes",
      content: "",
      activities: [],
      assessment: "",
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (
    index: number,
    updatedSection: LessonSection
  ) => {
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
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edit Lesson Plan
      </h1>

      <div className="space-y-6">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
        />

        <Input
          label="Duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={saving}
        />

        <div className="space-y-2">
          <label
            htmlFor="level"
            className="block text-sm font-medium text-gray-700"
          >
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

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Learning Intentions
            </h2>
            <Button
              onClick={handleAddObjective}
              variant="outline"
              size="sm"
              disabled={saving}
            >
              Add Learning Intention
            </Button>
          </div>
          {objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={objective}
                onChange={(e) => handleObjectiveChange(index, e.target.value)}
                disabled={saving}
                placeholder={`Learning Intention ${index + 1}`}
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
            <h2 className="text-lg font-medium text-gray-900">
              Success Criteria
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateSuccessCriteria}
                variant="outline"
                size="sm"
                disabled={saving || generatingCriteria}
                className="flex items-center gap-1"
              >
                {generatingCriteria ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
              <Button
                onClick={handleAddSuccessCriteria}
                variant="outline"
                size="sm"
                disabled={saving}
              >
                Add Criteria
              </Button>
            </div>
          </div>

          {criteriaMessage && (
            <div
              className={`p-3 rounded-lg ${
                criteriaMessage.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {criteriaMessage.text}
            </div>
          )}

          {successCriteria.map((criteria, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={criteria}
                onChange={(e) =>
                  handleSuccessCriteriaChange(index, e.target.value)
                }
                disabled={saving}
                placeholder={`Success Criteria ${index + 1}`}
              />
              <Button
                onClick={() => handleRemoveSuccessCriteria(index)}
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
            <h2 className="text-lg font-medium text-gray-900">
              Topic Background
            </h2>
            <Button
              onClick={handleGenerateBackground}
              variant="outline"
              size="sm"
              disabled={saving || generatingBackground}
              className="flex items-center gap-2"
            >
              {generatingBackground ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Background
                </>
              )}
            </Button>
          </div>
          {backgroundMessage && (
            <div
              className={`p-3 rounded-lg ${
                backgroundMessage.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {backgroundMessage.text}
            </div>
          )}
          <textarea
            value={topicBackground}
            onChange={(e) => setTopicBackground(e.target.value)}
            placeholder="Enter background information about the topic, tailored to the student level"
            rows={6}
            disabled={saving || generatingBackground}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Materials Needed
            </h2>
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
            <h2 className="text-lg font-medium text-gray-900">
              Lesson Sections
            </h2>
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
              onUpdate={(updatedSection) =>
                handleUpdateSection(index, updatedSection)
              }
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
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
