/**
 * Cloudflare Worker - Portfolio AI Chat API
 * 
 * Handles two endpoints:
 * - POST /chat - General Q&A about Jaedon
 * - POST /fit-check - Evaluates job description fit
 * 
 * Setup:
 * 1. Create a Cloudflare Worker at dash.cloudflare.com
 * 2. Add environment variable: GEMINI_API_KEY
 * 3. Deploy this code
 * 4. Update CORS origin to your domain
 */

// Your context data (embedded for simplicity - could also fetch from KV)
const CONTEXT = {
  name: "Jaedon Chin",
  title: "Cybersecurity Infrastructure Support Technician",
  location: "Houston, TX",
  education: "MIS @ Texas Southern University, graduating May 2026",
  certifications: ["CompTIA Security+ (Active)", "CompTIA CySA+ (In Progress)"],
  
  skills: {
    infrastructure: ["Docker/Compose", "Linux (Ubuntu)", "Traefik", "Cloudflare", "VPS management"],
    networking: ["Cisco Catalyst", "Cisco Meraki", "Cisco Firepower", "Network segmentation", "Wireshark"],
    security: ["Network security", "Risk assessment", "Incident response", "Firewall config", "Zero Trust"],
    development: ["TypeScript", "Next.js", "Python", "PostgreSQL", "Supabase", "Git", "Playwright", "n8n"]
  },
  
  experience: [
    {
      role: "Cybersecurity Infrastructure Support Technician",
      org: "Texas Southern University",
      period: "Apr 2025 - Present",
      highlights: ["Lead student tech for university's first cybersecurity lab", "Configure Cisco networking (Catalyst, Meraki, Firepower)", "Implement network segmentation and security controls"]
    },
    {
      role: "IT Technician – UPS Systems",
      org: "JosephOne Technologies / CCISD",
      period: "Aug 2025 - Present", 
      highlights: ["Installed 600+ enterprise UPS systems", "Enabled centralized monitoring and power redundancy"]
    },
    {
      role: "World Bank Project Intern",
      org: "National Electrification Project",
      period: "Jun 2022 - Aug 2022",
      highlights: ["IT infrastructure planning for solar projects (5,000+ households)", "Maintained secure databases"]
    }
  ],
  
  projects: [
    {
      name: "R-Value CRM",
      status: "In Progress",
      tech: ["Next.js", "TypeScript", "Supabase", "PostgreSQL"],
      description: "Full-stack CRM for service contractors with kanban pipeline, time tracking, cost analysis, and RLS security"
    },
    {
      name: "Production VPS Infrastructure", 
      status: "Complete",
      tech: ["Docker", "Traefik", "Cloudflare", "Ubuntu"],
      description: "Secure containerized hosting platform with automatic SSL, Cloudflare Tunnels, and container isolation"
    }
  ],
  
  achievements: ["1st Place NBA Tech Challenge (Beyond the Ball)", "Conference Presenter", "Title III Recognition", "2x President's List, 3x Dean's List"],
  
  targetRoles: ["Cybersecurity Engineer", "Infrastructure Engineer", "Cloud Security Engineer", "SOC Analyst"],
  targetSalary: "$80,000+",
  availability: "Full-time after May 2026 graduation",
  
  contact: {
    email: "jaechin9@gmail.com",
    github: "github.com/JaeChin",
    linkedin: "linkedin.com/in/jaedonchin"
  }
};

// System prompts
const CHAT_SYSTEM_PROMPT = `You are an AI assistant on Jaedon Chin's portfolio website. Your job is to answer questions about Jaedon accurately, professionally, and concisely.

## About Jaedon:
${JSON.stringify(CONTEXT, null, 2)}

## Guidelines:
- Be helpful, professional, and conversational
- Answer questions accurately based on the context provided
- If asked something not covered in the context, say you don't have that information
- Keep responses concise (2-4 sentences for simple questions, more for complex ones)
- Highlight relevant achievements and skills when appropriate
- If asked about contact info, provide it
- If asked about availability, mention May 2026 graduation
- Don't make up information not in the context
- Use a friendly but professional tone
- If someone asks to schedule a call or meeting, direct them to email: jaechin9@gmail.com`;

const FIT_CHECK_SYSTEM_PROMPT = `You are a career fit analyzer on Jaedon Chin's portfolio. Given a job description, evaluate how well Jaedon matches the role.

## Jaedon's Profile:
${JSON.stringify(CONTEXT, null, 2)}

## Your Task:
Analyze the job description and provide:

1. **Fit Score**: Rate 1-10 (10 = perfect match)
2. **Match Summary**: 2-3 sentence overview
3. **Strengths**: 3-5 bullet points of matching qualifications
4. **Gaps**: Any missing requirements (be honest but constructive)
5. **Recommendation**: Should Jaedon apply? Why or why not?

## Guidelines:
- Be honest and realistic
- Consider both technical skills AND soft skills/experience
- Note if the role requires more experience than Jaedon has
- Highlight Security+ certification when relevant
- Consider graduation date (May 2026) for start date requirements
- Format response clearly with headers`;

// CORS headers - UPDATE THIS TO YOUR DOMAIN
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Change to 'https://jaedonchin.dev' in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Gemini API call
async function callGemini(prompt, systemPrompt, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n---\n\nUser message: ${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini');
  }

  return data.candidates[0].content.parts[0].text;
}

// Main request handler
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    
    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      let responseText;

      if (url.pathname === '/chat') {
        // General chat endpoint
        if (!body.message || typeof body.message !== 'string') {
          throw new Error('Message is required');
        }
        
        responseText = await callGemini(body.message, CHAT_SYSTEM_PROMPT, env.GEMINI_API_KEY);
        
      } else if (url.pathname === '/fit-check') {
        // Fit check endpoint
        if (!body.jobDescription || typeof body.jobDescription !== 'string') {
          throw new Error('Job description is required');
        }
        
        responseText = await callGemini(
          `Analyze this job description for fit:\n\n${body.jobDescription}`,
          FIT_CHECK_SYSTEM_PROMPT,
          env.GEMINI_API_KEY
        );
        
      } else {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ response: responseText }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }
};
