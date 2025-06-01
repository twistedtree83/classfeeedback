import React from 'react';
import type { ProcessedLesson } from '../lib/types';
import { Clock, FileText, List, Target, CheckSquare, Plus, GraduationCap, BookOpen } from 'lucide-react';
import { Button } from './ui/Button';
import { sanitizeHtml } from '../lib/utils';

interface LessonPlanDisplayProps {
  lesson: ProcessedLesson;
  onAddToTeaching?: (cardType: 'objective' | 'material' | 'section' | 'activity' | 'topic_background', data: any) => void;
}

export function LessonPlanDisplay({ lesson, onAddToTeaching }: LessonPlanDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{lesson.title}</h2>
        
        <div 
          className="text-gray-700 mb-4"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.summary) }}
        ></div>
        
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-2">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            <span>{lesson.duration}</span>
          </div>
          
          {lesson.level && (
            <div className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2" />
              <span>Level: {lesson.level}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <Target className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold">Learning Intentions</h3>
        </div>
        <div className="space-y-4">
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            {lesson.objectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
          
          {lesson.success_criteria && lesson.success_criteria.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 flex items-center mb-2">
                <CheckSquare className="h-4 w-4 mr-2 text-indigo-600" />
                Success Criteria
              </h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                {lesson.success_criteria.map((criteria, index) => (
                  <li key={index}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}
          
          {onAddToTeaching && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const content = lesson.success_criteria && lesson.success_criteria.length > 0
                  ? `${lesson.objectives.map(obj => `• ${obj}`).join('\n')}\n\n**Success Criteria:**\n${lesson.success_criteria.map(sc => `• ${sc}`).join('\n')}`
                  : lesson.objectives.map(obj => `• ${obj}`).join('\n');
                
                onAddToTeaching('objective', {
                  title: 'Learning Intentions and Success Criteria',
                  content
                });
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add to Teaching
            </Button>
          )}
        </div>
      </div>

      {lesson.topic_background && (
        <div>
          <div className="flex items-center mb-3">
            <BookOpen className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold">Topic Background</h3>
          </div>
          <div className="space-y-4">
            <div 
              className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.topic_background) }}
            ></div>
            {onAddToTeaching && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddToTeaching('topic_background', {
                  title: 'Topic Background',
                  content: lesson.topic_background
                })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add to Teaching
              </Button>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center mb-3">
          <FileText className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold">Materials Needed</h3>
        </div>
        <div className="space-y-4">
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            {lesson.materials.map((material, index) => (
              <li key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(material) }}></li>
            ))}
          </ul>
          {onAddToTeaching && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddToTeaching('material', {
                title: 'Required Materials',
                content: lesson.materials.map(mat => `• ${mat}`).join('\n')
              })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add to Teaching
            </Button>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <List className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold">Lesson Sections</h3>
        </div>
        <div className="space-y-6">
          {lesson.sections.map((section) => (
            <div
              key={section.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-medium text-gray-800">
                  {section.title}
                </h4>
                <span className="text-sm text-gray-500">{section.duration}</span>
              </div>
              <div 
                className="text-gray-600 mb-4"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
              ></div>
              {onAddToTeaching && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddToTeaching('section', {
                    title: section.title,
                    content: section.content,
                    duration: section.duration,
                    sectionId: section.id
                  })}
                  className="flex items-center gap-2 mb-4"
                >
                  <Plus className="h-4 w-4" />
                  Add Section to Teaching
                </Button>
              )}
              {section.activities.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Activities:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {section.activities.map((activity, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity) }}></div>
                        {onAddToTeaching && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddToTeaching('activity', {
                              title: `Activity: ${section.title}`,
                              content: activity,
                              sectionId: section.id,
                              activityIndex: index
                            })}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {section.assessment && (
                <div className="mt-4">
                  <div className="flex items-center text-gray-700 mb-2">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    <h5 className="font-medium">Assessment</h5>
                  </div>
                  <div 
                    className="text-gray-600"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.assessment) }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}