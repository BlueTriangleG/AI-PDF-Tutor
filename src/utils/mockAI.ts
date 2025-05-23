import { ExplanationLevel } from '../types';

/**
 * Generate a mock AI response for demonstration purposes
 * In a real implementation, this would be replaced with an actual API call
 */
export const generateMockResponse = async (
  text: string,
  level: ExplanationLevel
): Promise<string> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Get first 100 characters for simplicity
  const snippet = text.substring(0, 100).trim();
  
  switch (level) {
    case 'eli5':
      return `Here's a simple explanation like you're 5 years old:
      
This part of the document is talking about "${snippet}...". 

Think of it like this: ${generateSimpleAnalogy(snippet)}

Does that make sense? Let me know if you want me to explain any part of this differently!`;

    case 'highlevel':
      return `Here's a high-level overview of this section:
      
The text discusses "${snippet}..." which is important because it establishes key concepts in this document.

The main points are:
- ${generateBulletPoint(1)}
- ${generateBulletPoint(2)}
- ${generateBulletPoint(3)}

Would you like me to elaborate on any of these points?`;

    case 'detailed':
      return `Here's a detailed explanation of this content:
      
The text reads: "${snippet}..."

This is significant because ${generateDetailedAnalysis(1)}. Furthermore, it connects to ${generateDetailedAnalysis(2)}.

The technical aspects include:
1. ${generateTechnicalPoint(1)}
2. ${generateTechnicalPoint(2)}
3. ${generateTechnicalPoint(3)}

Let me know if you'd like me to break down any specific part in more detail.`;

    default:
      return `I've analyzed this section and found some interesting information. Let me know if you have any specific questions!`;
  }
};

// Helper functions to generate mock content
function generateSimpleAnalogy(text: string): string {
  const analogies = [
    "it's like when you build a tower with blocks, you need a strong base first",
    "imagine you're explaining a game to a friend who's never played before",
    "it's similar to how you learn to ride a bike before you can do tricks",
    "think about how you need to learn the alphabet before you can read books"
  ];
  
  return analogies[Math.floor(Math.random() * analogies.length)];
}

function generateBulletPoint(index: number): string {
  const points = [
    "The author establishes fundamental concepts that will be built upon later",
    "There's an important relationship between key elements in the text",
    "This section introduces terminology that will be used throughout the document",
    "The context provided here helps understand upcoming complex ideas",
    "This part serves as a bridge between previous and future topics"
  ];
  
  return points[(index + Math.floor(Math.random() * 3)) % points.length];
}

function generateDetailedAnalysis(index: number): string {
  const analyses = [
    "it establishes the theoretical framework for the subsequent methodological approach",
    "it challenges conventional understanding by presenting alternative perspectives",
    "it synthesizes previous research while identifying gaps in current knowledge",
    "it lays groundwork for the empirical investigation that follows",
    "it contextualizes the problem within the broader academic discourse"
  ];
  
  return analyses[(index + Math.floor(Math.random() * 3)) % analyses.length];
}

function generateTechnicalPoint(index: number): string {
  const points = [
    "The methodology employs a multi-faceted approach to data analysis",
    "Statistical significance was established through rigorous testing protocols",
    "The conceptual model integrates both qualitative and quantitative elements",
    "Implementation considerations include scalability and performance optimization",
    "Theoretical implications extend beyond the immediate application context"
  ];
  
  return points[(index + Math.floor(Math.random() * 3)) % points.length];
}