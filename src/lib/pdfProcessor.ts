import { OpenAI } from 'openai';
import * as pdfParse from 'pdf-parse';
import type { ProcessedLesson } from './types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo, use backend in production
});

export async function processPDF(file: File): Promise<ProcessedLesson> {
  try {
    // Read PDF content
    const buffer = await file.arrayBuffer();
    const data = await pdfParse(buffer);
    const pdfText = data.text;

    // Process with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a teaching assistant that helps process lesson plans. 
          Extract the following information from the lesson plan:
          - Title (if not already provided)
          - Learning objectives
          - Duration
          - Required materials
          - Lesson sections with:
            - Section title
            - Duration
            - Content
            - Activities`
        },
        {
          role: 'user',
          content: pdfText
        }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content) as ProcessedLesson;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}