import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StartButtonCardProps {
  className?: string;
  onStartTeaching: () => void;
  isStartingTeaching: boolean;
  hasCards: boolean;
}

export function StartButtonCard({
  className,
  onStartTeaching,
  isStartingTeaching,
  hasCards
}: StartButtonCardProps) {
  return (
    <Card className={cn("shadow-card border-border/50", className)}>
      <CardContent className="p-6">
        <Button
          onClick={onStartTeaching}
          disabled={isStartingTeaching || !hasCards}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isStartingTeaching ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Starting Session...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Start Teaching
            </>
          )}
        </Button>
        
        {!hasCards && (
          <p className="text-sm text-muted-foreground mt-3 text-center">
            Add at least one card to start teaching
          </p>
        )}
      </CardContent>
    </Card>
  );
}