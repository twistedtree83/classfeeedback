import React from 'react';
import type { ProcessedLesson } from '../lib/types';
import { Clock, Target, FileText, GraduationCap, BookOpen, CheckSquare } from 'lucide-react';
import { sanitizeHtml } from '../lib/utils';

interface LessonPreviewProps {
  lesson: ProcessedLesson;
}

export function LessonPreview({ lesson }: LessonPreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span>{lesson.duration}</span>
          </div>
          {lesson.level && (
            <div className="flex items-center">
              <GraduationCap className="w-4 h-4 mr-2" />
              <span>Level: {lesson.level}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <Target className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Learning Intentions</h3>
        </div>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {lesson.objectives.map((objective, index) => (
            <li key={index}>{objective}</li>
          ))}
        </ul>
      </div>

      {lesson.success_criteria && lesson.success_criteria.length > 0 && (
        <div>
          <div className="flex items-center mb-3">
            <CheckSquare className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Success Criteria</h3>
          </div>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {lesson.success_criteria.map((criteria, index) => (
              <li key={index}>{criteria}</li>
            ))}
          </ul>
        </div>
      )}

      {lesson.topic_background && (
        <div>
          <div className="flex items-center mb-3">
            <BookOpen className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Topic Background</h3>
          </div>
          <div 
            className="p-3 bg-blue-50 rounded-lg text-gray-700 text-sm"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.topic_background) }}
          ></div>
        </div>
      )}

      <div>
        <div className="flex items-center mb-3">
          <FileText className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Materials Needed</h3>
        </div>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {lesson.materials.map((material, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(material) }}></li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        {lesson.sections.map((section) => (
          <div key={section.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900">{section.title}</h4>
              <span className="text-sm text-gray-500">{section.duration}</span>
            </div>
            <div 
              className="text-gray-700 mb-3"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
            ></div>
            {section.activities.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Activities</h5>
                <ul className="list-disc list-inside text-gray-700">
                  {section.activities.map((activity, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity) }}></li>
                  ))}
                </ul>
              </div>
            )}
            {section.assessment && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h5 className="font-medium text-gray-900 mb-1">Assessment</h5>
                <div 
                  className="text-gray-700 text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.assessment) }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}