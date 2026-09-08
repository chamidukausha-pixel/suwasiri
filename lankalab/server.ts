import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini API Client
let aiInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please add it in Settings > Secrets.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Endpoint: Analyze lab report
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { patientName, age, gender, testType, priority, results, notes, wardOrDept } = req.body;
    
    if (!patientName) {
      return res.status(400).json({ error: 'Patient name is required for analysis' });
    }

    const ai = getGenAI();
    const resultDetailsString = results && results.length > 0 
      ? results.map((r: any) => `- ${r.parameter}: ${r.value} ${r.unit} (Ref: ${r.referenceRange}) [Abnormal: ${r.isAbnormal ? 'YES' : 'NO'}]`).join('\n')
      : 'No quantitative values available yet (Pending or processing).';

    const prompt = `You are a Senior Clinical Pathologist and Medical Advisor for LankaLab Portal, supporting a general practice center in Colombo, Sri Lanka.
    Please review the following lab order details and provide an expert diagnostic interpretation.
    
    PATIENT PROFILE:
    - Name: ${patientName}
    - Age: ${age}
    - Gender: ${gender}
    - Ward/Dept: ${wardOrDept || 'Not specified'}
    
    LAB TEST:
    - Test Type: ${testType}
    - Order Priority: ${priority}
    - Clinician Intake Notes: "${notes || 'No notes provided'}"
    
    LAB MEASUREMENTS:
    ${resultDetailsString}
    
    Please provide your response organized in exactly the following readable Markdown sections:
    
    ### 🔬 Executive Pathology Summary
    (A 3-4 sentence plain human clinical explanation of the overall lab picture. Interpret the results holistically, e.g. acute cardiac event if high troponins, anemia or thyroid indicators, or normal baseline check if healthy.)
    
    ### ⚠️ Alarm Findings & Critical Risks
    (Highlight parameters that are out of bounds or present immediate hazards with a bullet points. If no alerts are present, note that the profile represents a safe healthy balance.)
    
    ### 📋 Next Diagnostic & Clinical Steps
    (Provide 3 actionable medical steps for the managing clinician, e.g., re-running test, consulting specialist, therapeutic actions, dietary counseling, or repeating the assay at a specified interval.)
    
    ### 📝 Clinician Note Draft (Ready to Copy)
    (A professional, elegant medical consultation note draft summarizing the intake history, clinical findings, lab diagnostics, and tentative assessment. Perfect for pasting into the EHR.)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2, // slightly lower for clinical consistency
      }
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error('Error in analyze endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred during Gemini AI analysis',
      needsSecretsConfig: !process.env.GEMINI_API_KEY
    });
  }
});

// Endpoint: AI Clinical chat consult
app.post('/api/gemini/consult', async (req, res) => {
  try {
    const { question, patientContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Consultation question is required.' });
    }

    const ai = getGenAI();
    let prompt = `You are the LankaLab Portal Clinical Advisor, a specialized AI assistant. Answer the doctor's query with medical precision, citing common laboratory reference guidelines (such as WHO, ACC/AHA, or standard pathology parameters). Keep answers professional, concise, and structured.`;
    
    if (patientContext) {
      prompt += `\n\nPatient Context:\n${JSON.stringify(patientContext)}`;
    }
    
    prompt += `\n\nClinician Question:\n"${question}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error('Error in consult endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred during consultation',
      needsSecretsConfig: !process.env.GEMINI_API_KEY
    });
  }
});

// Endpoint: Parse uploaded lab document/report text using Gemini for automated database link
app.post('/api/gemini/parse-report', async (req, res) => {
  try {
    const { documentText } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: 'Raw document text is required for parsing.' });
    }

    const ai = getGenAI();
    const prompt = `You are a medical lab report document digitizer for Sri Lankan clinical systems.
    Parse the raw OCR/text lab document below, and extract patient details and results.
    Return ONLY a valid JSON object matching this schema. Do not output any markdown formatting backticks. Just the raw JSON block.
    
    SCHEMA:
    {
      "patientName": "Full Name",
      "age": 30,
      "gender": "Male" or "Female" or "Other",
      "testType": "Test Profile Name (e.g., FBC, Troponin, Lipid Profile)",
      "priority": "Routine" or "Urgent" or "Critical",
      "results": [
        { "parameter": "Name of Assay", "value": "measured value", "unit": "unit", "referenceRange": "normal range", "isAbnormal": true/false }
      ],
      "parsedSummary": "Pathologist overview summary of clinical findings."
    }

    RAW DOCUMENT TEXT FOR EXTRACTION:
    """
    ${documentText}
    """`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    try {
      const parsedData = JSON.parse(response.text.trim());
      res.json(parsedData);
    } catch (parseErr) {
      console.warn('Failed to parse Gemini output as strict JSON, attempting cleanup or fallback:', response.text);
      res.status(500).json({ error: 'Gemini did not return schema-compliant JSON. Output was: ' + response.text });
    }
  } catch (error: any) {
    console.error('Error in parse-report endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to parse lab report document',
      needsSecretsConfig: !process.env.GEMINI_API_KEY
    });
  }
});


// Configure Vite for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LankaLab Server running on port ${PORT}`);
  });
}

startServer();
