import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, GraduationCap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { ProcessedLesson } from '@/lib/types';

interface LessonHeaderProps {
  lesson: ProcessedLesson;
  error: string | null;
  onStartTeaching: () => void;
  isStartingTeaching: boolean;
  hasCards: boolean;
}

export function LessonHeader({ 
  lesson, 
  error, 
  onStartTeaching, 
  isStartingTeaching, 
  hasCards 
}: LessonHeaderProps) {
  return (
    <Card className="shadow-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" asChild className="h-8 gap-1">
            <Link to="/planner">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
          </Button>

          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold leading-tight tracking-tight font-display">
              {lesson.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
              <BookOpen className="h-4 w-4" />
              <span>{lesson.level || 'No level specified'}</span>
              <span>•</span>
              <span>{lesson.duration || 'No duration specified'}</span>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={onStartTeaching}
                    disabled={isStartingTeaching || !hasCards}
                    size="lg"
                  >
                    {isStartingTeaching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Start Teaching
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {!hasCards 
                  ? "Add at least one card to start teaching" 
                  : "Start a live teaching session with these cards"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {error && (
          <div className="p-3 mb-2 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="text-muted-foreground text-sm max-w-prose">
          {lesson.summary}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="inline-flex items-center rounded-md bg-secondary/10 px-3 py-1 text-sm">
            <Clock className="h-4 w-4 mr-2 text-secondary" />
            <span>{lesson.duration}</span>
          </div>

          {lesson.level && (
            <div className="inline-flex items-center rounded-md bg-accent/10 px-3 py-1 text-sm">
              <GraduationCap className="h-4 w-4 mr-2 text-accent" />
              <span>Level: {lesson.level}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}