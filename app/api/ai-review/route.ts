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

    const prompt = `Review this Terraform configuration and provide a quick analysis:

${terraformContent}

Respond with valid JSON only:
{
  "overallScore": <number 0-100>,
  "summary": "<brief summary>",
  "strengths": ["<strength1>", "<strength2>"],
  "issues": [
    {
      "severity": "<high|medium|low>",
      "category": "<security|performance|cost|best-practices>",
      "description": "<issue description>",
      "recommendation": "<fix suggestion>",
      "file": "<filename>",
      "line": <line_number>
    }
  ],
  "recommendations": [
    {
      "category": "<security|performance|cost|best-practices>",
      "title": "<title>",
      "description": "<description>",
      "impact": "<high|medium|low>"
    }
  ],
  "costOptimization": {
    "estimatedMonthlyCost": "<cost estimate or 'Unable to estimate'>",
    "suggestions": ["<suggestion1>", "<suggestion2>"]
  },
  "securityAnalysis": {
    "securityScore": <number 0-100>,
    "findings": ["<finding1>", "<finding2>"]
  }
}`;

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timeout')), 20000); // 20 second timeout
    });

    const completionPromise = openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a Terraform code reviewer. Analyze the code and respond with valid JSON only. Be direct and practical in your feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]) as any;

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
