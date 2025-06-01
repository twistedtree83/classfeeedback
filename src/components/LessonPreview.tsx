import React from 'react';
import type { ProcessedLesson } from '../lib/types';
import { Clock, Target, FileText, GraduationCap } from 'lucide-react';

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
          <h3 className="font-semibold text-gray-900">Learning Objectives</h3>
        </div>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {lesson.objectives.map((objective, index) => (
            <li key={index}>{objective}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <FileText className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Materials Needed</h3>
        </div>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {lesson.materials.map((material, index) => (
            <li key={index}>{material}</li>
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
            <p className="text-gray-700 mb-3">{section.content}</p>
            {section.activities.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Activities</h5>
                <ul className="list-disc list-inside text-gray-700">
                  {section.activities.map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}