import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordleConfigCardProps {
  className?: string;
  wordleEnabled: boolean;
  wordleWord: string;
  isGeneratingWord: boolean;
  onWordleEnabledChange: (enabled: boolean) => void;
  onWordleWordChange: (word: string) => void;
  onGenerateWordleWord: () => void;
}

export function WordleConfigCard({
  className,
  wordleEnabled,
  wordleWord,
  isGeneratingWord,
  onWordleEnabledChange,
  onWordleWordChange,
  onGenerateWordleWord
}: WordleConfigCardProps) {
  return (
    <Card className={cn("shadow-card border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-display">Teaching Options</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="wordle">Waiting Room Wordle Game</Label>
            <p className="text-sm text-muted-foreground">
              Students can play Wordle while waiting
            </p>
          </div>
          <Switch 
            id="wordle"
            checked={wordleEnabled}
            onCheckedChange={onWordleEnabledChange}
          />
        </div>
        
        {wordleEnabled && (
          <div className="rounded-md border border-border p-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="wordleWord">Wordle Word (5 letters)</Label>
              <div className="flex gap-2">
                <Input
                  id="wordleWord"
                  value={wordleWord}
                  onChange={(e) => onWordleWordChange(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="uppercase"
                  placeholder="WORD"
                  pattern="[A-Za-z]{5}"
                  title="5 letters A-Z"
                />
                
                <Button
                  onClick={onGenerateWordleWord}
                  disabled={isGeneratingWord}
                  variant="outline"
                  size="sm"
                  className="focus:ring-brand focus:ring-offset-2"
                >
                  {isGeneratingWord ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      <span className="sr-only">Generating</span>
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a 5-letter word related to the lesson content
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}