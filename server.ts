import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Serve static assets from '/assets'
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve root static files (such as index.html)
app.use(express.static(__dirname));

// Server-side Gemini API client proxy
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'API_KEY_MISSING',
        message: 'مفتاح API غير متوفر في البيئة الحالية.'
      });
    }

    // Lazy initialization of the GoogleGenAI client
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const { message, history, context } = req.body;

    const systemInstruction = `You are a highly specialized and structured planning assistant for a high-school and school management system called "مدرستي" (Madrasati) in Iraq.
Your primary role is to act as a structured planner and helper for 4 different roles:
1. Student (طالب): Grades (e.g. السادس العلمي, الثالث المتوسط), subjects, weak areas, revision plans, study schedules, and ministerial (وزاريات) questions.
2. Teacher (مدرس): Teacher schedules, classes, divisions, subjects, rooms, substitutions, lesson times, and conflicts.
3. Assistant (معاون): School schedules, teacher and room availability, supervision (مراقبة), and substitutions.
4. Director (مدير): All school schedules, staff directories, exam halls, seat layouts, room capacities, sorting, and school-wide conflicts.

The user's active context is:
- Active Role: ${context.activeRole || 'طالب'}
- Active Module: ${context.activeModule || 'تنظيم الدراسة'}
- Current Page/Step: ${context.currentPage || 'الرئيسية'}
- School/Student Context: ${JSON.stringify(context.studentContext || {})}
- Active Schedule Metadata: ${JSON.stringify(context.currentSchedule || {})}
- Exam Session Metadata: ${JSON.stringify(context.examContext || {})}

STRICT CONTEXT RULES:
- NEVER assume the user is a student or belongs to "السادس العلمي" unless context.activeRole is 'طالب' and their grade is indeed "السادس العلمي".
- Tailor your tone, facts, and intent detection precisely to the user's active role (${context.activeRole || 'طالب'}) and active module (${context.activeModule || 'تنظيم الدراسة'}).
- If a Director writes about student counts and exam halls, detect:
  - role: "مدير" (director)
  - module: "القاعات الامتحانية" (exam_halls)
  - intent: "توزيع طلاب امتحاني" (create_exam_distribution)
  - Do NOT talk about study schedules, revision, or sixth scientific grade if they are a Director managing exam halls! Ask for necessary missing information (like room capacities, seats per desk, distribution methods) if not provided.

RESPONSE STRUCTURE:
You must respond strictly in JSON format matching this schema:
{
  "detectedRole": "student" | "teacher" | "assistant" | "director",
  "detectedModule": "study_schedule" | "school_schedule" | "teacher_schedule" | "exam_halls" | "curriculum_tree" | "exams" | "staff" | "reviews" | "printing_export",
  "detectedIntent": "intent_code_string",
  "extractedFacts": {
    "key": "value"
  },
  "missingRequiredFields": ["field1", "field2"],
  "safeArabicReply": "Your professional, helpful Arabic reply formatted in Markdown. Write with an elegant, encouraging tone.",
  "suggestedActions": [
    {
      "label": "Action button text in Arabic",
      "value": "action_code_string"
    }
  ],
  "requiresConfirmation": true | false,
  "confidenceLevel": "high" | "medium" | "low"
}

NO AUTOMATIC CHANGES:
Remember, no schedule, room, student, or staff changes can happen automatically. If the user wants to make a change, set "requiresConfirmation": true and describe the changes in "safeArabicReply".

Always respond in Arabic, focusing on Iraqi ministry specifications (e.g. Friday-to-Thursday schedule, ministerial questions for terminal classes, division-based sorting, etc.).`;

    const chatHistoryParts = (history || []).map((h: any) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    // Add current user message
    chatHistoryParts.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: chatHistoryParts,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedRole: { type: Type.STRING },
            detectedModule: { type: Type.STRING },
            detectedIntent: { type: Type.STRING },
            extractedFacts: { type: Type.OBJECT },
            missingRequiredFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            safeArabicReply: { type: Type.STRING },
            suggestedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING }
                },
                required: ['label', 'value']
              }
            },
            requiresConfirmation: { type: Type.BOOLEAN },
            confidenceLevel: { type: Type.STRING }
          },
          required: [
            'detectedRole',
            'detectedModule',
            'detectedIntent',
            'extractedFacts',
            'missingRequiredFields',
            'safeArabicReply',
            'suggestedActions',
            'requiresConfirmation',
            'confidenceLevel'
          ]
        }
      }
    });

    const replyJsonText = response.text;
    if (!replyJsonText) {
      throw new Error('Empty response from Gemini');
    }

    const parsedResponse = JSON.parse(replyJsonText);
    res.json(parsedResponse);

  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: 'API_ERROR',
      message: 'المساعد الذكي غير متاح مؤقتاً، لكن يمكنك متابعة التنظيم اليدوي أو استخدام الاقتراحات المحلية.',
      details: error.message
    });
  }
});

// Fallback to index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

