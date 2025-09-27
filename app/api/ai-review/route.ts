import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { terraformFiles, provider } = await request.json();

    if (!terraformFiles || Object.keys(terraformFiles).length === 0) {
      return NextResponse.json(
        { error: 'No Terraform files provided' },
        { status: 400 }
      );
    }

    // Combine all Terraform files into a single context
    const terraformContent = Object.entries(terraformFiles)
      .map(([filename, content]) => `## ${filename}\n\`\`\`hcl\n${content}\n\`\`\``)
      .join('\n\n');

    const prompt = `Analyze ONLY the provided Terraform configuration. Base your analysis strictly on what is visible in the code.

${terraformContent}

CRITICAL RULES:
- Analyze ONLY what you can see in the provided files
- Do NOT assume missing configurations exist elsewhere
- Do NOT make recommendations about files/resources not shown
- If information is missing, state "insufficient information" rather than assuming
- Be conservative in scoring - only give high scores for clearly visible best practices
- For cost estimates, only estimate if you can see specific resource configurations

Respond with ONLY valid JSON in this exact structure:

{
  "overallScore": <number 0-100>,
  "summary": "<string: what you can observe from the provided files only>",
  "strengths": ["<string: only visible strengths>"],
  "issues": [
    {
      "severity": "<high|medium|low>",
      "category": "<security|performance|cost|best-practices|syntax>",
      "description": "<string: only issues you can see>",
      "recommendation": "<string: specific to visible code>",
      "file": "<string: actual filename>",
      "line": <number: actual line number>
    }
  ],
  "recommendations": [
    {
      "category": "<security|performance|cost|best-practices>",
      "title": "<string>",
      "description": "<string: based only on visible code>",
      "impact": "<high|medium|low>"
    }
  ],
  "costOptimization": {
    "estimatedMonthlyCost": "<string: 'Unable to estimate' if insufficient resource details>",
    "suggestions": ["<string: only if you can see specific inefficiencies>"]
  },
  "securityAnalysis": {
    "securityScore": <number 0-100>,
    "findings": ["<string: only security issues you can actually see>"]
  }
}

JSON formatting rules:
- Valid JSON only, no markdown or explanations
- Use "Unable to determine" or "Insufficient information" when you cannot see relevant details
- Empty arrays [] are acceptable when no issues/recommendations are visible
- Be specific about file names and line numbers from the actual code provided`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert Terraform analyst. You MUST respond with valid JSON only. No explanations, no markdown, no additional text. Just pure JSON matching the exact schema provided."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the JSON response
    let analysis;
    try {
      analysis = JSON.parse(response);
      
      // Validate required fields
      if (!analysis.overallScore || !analysis.summary || !Array.isArray(analysis.strengths)) {
        throw new Error('Invalid JSON structure');
      }
      
      // Ensure arrays exist
      analysis.issues = analysis.issues || [];
      analysis.recommendations = analysis.recommendations || [];
      analysis.costOptimization = analysis.costOptimization || { estimatedMonthlyCost: "Unknown", suggestions: [] };
      analysis.securityAnalysis = analysis.securityAnalysis || { securityScore: 0, findings: [] };
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Response:', response);
      
      // Return a structured fallback response
      analysis = {
        overallScore: 50,
        summary: "Analysis failed due to invalid response format. Please try again.",
        strengths: ["Infrastructure files were successfully processed"],
        issues: [
          {
            severity: "high",
            category: "syntax",
            description: "AI response parsing failed",
            recommendation: "Retry the analysis or check the configuration manually",
            file: "system",
            line: 0
          }
        ],
        recommendations: [
          {
            category: "best-practices",
            title: "Retry Analysis",
            description: "The AI analysis encountered a formatting issue. Please try running the analysis again.",
            impact: "medium"
          }
        ],
        costOptimization: {
          estimatedMonthlyCost: "Unable to estimate",
          suggestions: ["Manual review required due to analysis error"]
        },
        securityAnalysis: {
          securityScore: 0,
          findings: ["Security analysis incomplete due to parsing error"]
        }
      };
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('AI Review Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze infrastructure',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
