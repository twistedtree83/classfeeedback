import React from 'react';
import type { ProcessedLesson } from '../lib/types';
import { Clock, FileText, List, Target } from 'lucide-react';

interface LessonPlanDisplayProps {
  lesson: ProcessedLesson;
}

export function LessonPlanDisplay({ lesson }: LessonPlanDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{lesson.title}</h2>
        
        <div className="flex items-center text-gray-600 mb-2">
          <Clock className="h-5 w-5 mr-2" />
          <span>{lesson.duration}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <Target className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold">Learning Objectives</h3>
        </div>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          {lesson.objectives.map((objective, index) => (
            <li key={index}>{objective}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <FileText className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold">Materials Needed</h3>
        </div>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          {lesson.materials.map((material, index) => (
            <li key={index}>{material}</li>
          ))}
        </ul>
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
              <p className="text-gray-600 mb-4">{section.content}</p>
              {section.activities.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Activities:</h5>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
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
    </div>
  );
}