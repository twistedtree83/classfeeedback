import React, { useState, useEffect, useRef } from 'react';
import { analyzeVocabulary } from '@/lib/ai/vocabularyAnalysis';
import { VocabularyPopup } from './VocabularyPopup';
import { sanitizeHtml } from '@/lib/utils';
import { getVocabularyTermsForLesson, saveVocabularyTerms } from '@/lib/supabase/vocabulary';

interface VocabularyHighlighterProps {
  content: string;
  level?: string;
  lessonId?: string;
}

export function VocabularyHighlighter({
  content,
  level = "",
  lessonId
}: VocabularyHighlighterProps) {
  const [highlightedContent, setHighlightedContent] = useState<string>(content);
  const [vocabulary, setVocabulary] = useState<Array<{ word: string; definition: string }>>([]);
  const [activeWord, setActiveWord] = useState<{word: string; definition: string} | null>(null);
  const [position, setPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Analyze content for vocabulary when component mounts or content changes
  useEffect(() => {
    const analyzeContent = async () => {
      if (!content || isAnalyzing) return;
      
      setIsAnalyzing(true);
      try {
        console.log('Analyzing vocabulary for content...');
        
        let vocabTerms: Array<{ word: string; definition: string }> = [];
        
        // Try to fetch existing vocabulary from database first
        if (lessonId) {
          try {
            console.log('Fetching existing vocabulary terms for lesson:', lessonId);
            const existingTerms = await getVocabularyTermsForLesson(lessonId);
            
            if (existingTerms && existingTerms.length > 0) {
              console.log('Found existing vocabulary terms:', existingTerms.length);
              // Convert DB terms to the format we need
              const dbTerms = existingTerms.map(term => ({
                word: term.word,
                definition: term.definition
              }));
              
              // Use these terms as our initial set
              vocabTerms = dbTerms;
            }
          } catch (err) {
            console.error('Error fetching vocabulary terms from database:', err);
          }
        }
        
        // If we don't have enough terms from the database, analyze with AI
        if (vocabTerms.length < 15) {
          console.log('Getting more vocabulary terms from AI analysis');
          const aiTerms = await analyzeVocabulary(content, level, 25);
          
          // Create a map of existing terms to avoid duplicates
          const existingTermsMap = new Map(vocabTerms.map(term => [term.word.toLowerCase(), term]));
          
          // Add new terms from AI that aren't already in our list
          for (const term of aiTerms) {
            if (!existingTermsMap.has(term.word.toLowerCase())) {
              vocabTerms.push(term);
              existingTermsMap.set(term.word.toLowerCase(), term);
            }
          }
          
          // Save new terms to database if we have a lessonId
          if (lessonId) {
            try {
              console.log('Saving new vocabulary terms to database');
              // Only save terms that came from AI and weren't in the database
              const newTerms = aiTerms.filter(term => 
                !existingTermsMap.has(term.word.toLowerCase()) || 
                existingTermsMap.get(term.word.toLowerCase())?.definition !== term.definition
              );
              
              if (newTerms.length > 0) {
                await saveVocabularyTerms(lessonId, newTerms);
                console.log('Saved', newTerms.length, 'new terms to database');
              }
            } catch (err) {
              console.error('Error saving vocabulary terms to database:', err);
            }
          }
        }
        
        console.log('Identified vocabulary terms:', vocabTerms);
        setVocabulary(vocabTerms);
        
        // Process content with HTML and highlight terms
        let processedContent = sanitizeHtml(content);
        
        // Replace identified terms with highlighted spans
        vocabTerms.forEach(term => {
          const regex = new RegExp(`\\b(${escapeRegExp(term.word)})\\b`, 'gi');
          processedContent = processedContent.replace(
            regex, 
            `<span class="vocabulary-term" data-word="${term.word}" data-definition="${term.definition.replace(/"/g, '&quot;')}">$1</span>`
          );
        });
        
        setHighlightedContent(processedContent);
      } catch (error) {
        console.error('Error analyzing vocabulary:', error);
        setHighlightedContent(sanitizeHtml(content));
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    analyzeContent();
  }, [content, level, lessonId]);
  
  // Set up event listeners for term clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // First check if we clicked on a vocabulary term
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('vocabulary-term')) {
        e.preventDefault();
        const word = target.getAttribute('data-word');
        const definition = target.getAttribute('data-definition');
        
        if (word && definition) {
          setActiveWord({ word, definition });
          
          // Calculate position - near the clicked element
          const rect = target.getBoundingClientRect();
          setPosition({ 
            x: rect.left + window.scrollX, 
            y: rect.bottom + window.scrollY
          });
        }
        
        return;
      }
      
      // If we clicked outside a term and outside the popup, close the popup
      if (activeWord && !target.closest('.vocabulary-popup')) {
        setActiveWord(null);
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [activeWord]);
  
  // Helper function to escape special characters in regex
  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  return (
    <div className="vocabulary-container" ref={containerRef}>
      {/* Display the highlighted content */}
      <div 
        className="prose max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
      
      {/* Show the popup if a word is active */}
      {activeWord && (
        <VocabularyPopup
          word={activeWord.word}
          definition={activeWord.definition}
          position={position}
          onClose={() => setActiveWord(null)}
          level={level}
        />
      )}
    </div>
  );
}