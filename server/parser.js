const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// text: extracted document text. pdfPath (optional): for scanned PDFs with no
// text layer, the PDF itself is sent to OpenAI, which reads the pages directly.
async function parseDocument(text, { pdfPath } = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `You are an expert document parser for property management contracts and estimates. Extract the following fields from the document text below and return ONLY a valid JSON object with no markdown formatting, no code blocks, and no extra text.

Fields to extract:
- estimateDate: Date of estimate or contract (ISO 8601 format or null)
- supplierName: Company or vendor name (string or null)
- property: Must be exactly one of: "Canyon View", "Rockpoint", "Boulder Canyon", or "Other". Infer from document content if possible, otherwise use "Other".
- description: A concise 2-3 sentence summary describing what the contract or estimate covers. Write it as a direct description - DO NOT start with "This document is", "This is a", or similar meta-phrasing. Just state what the agreement covers. (string or null)
- keywords: Array of 3-8 relevant keywords/tags (array of strings)
- serviceCategory: The type of service (e.g., "Pool Maintenance", "Landscaping", "HVAC", "Plumbing", "Electrical", "Renovation", "Cleaning", "Security", "General Contracting", etc.) (string or null)
- totalPrice: Total dollar amount as a number (number or null)
- recurring: true if this is a recurring service/contract, false if one-time (boolean)
- billingInterval: How often billing occurs if recurring (e.g., "Monthly", "Quarterly", "Annual", "Weekly", null)
- intervalAmount: Amount per billing interval if recurring (number or null)
- expirationDate: Contract or estimate expiration date (ISO 8601 format or null)
- cancellationTerms: Cancellation terms or notice period (string or null)

${pdfPath ? `- extractedText: A plain-text transcription of all readable text in the document (string)

` : ''}If a field cannot be found, use null. For keywords, return an array of strings. For recurring, return true or false. For totalPrice and intervalAmount, return numbers without currency symbols. For dates, return ISO 8601 format (YYYY-MM-DD) or null.

${pdfPath ? 'The document is the attached PDF.' : `Document text:
"""
${text.substring(0, 12000)}
"""`}`;

  const userContent = pdfPath
    ? [
        {
          type: 'file',
          file: {
            filename: path.basename(pdfPath),
            file_data: `data:application/pdf;base64,${fs.readFileSync(pdfPath).toString('base64')}`
          }
        },
        { type: 'text', text: prompt }
      ]
    : prompt;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You extract structured data from property management documents and return only valid JSON.' },
      { role: 'user', content: userContent }
    ],
    temperature: 0.1
  });

  const content = response.choices[0].message.content.trim();
  
  let jsonStr = content;
  if (content.startsWith('```json')) {
    jsonStr = content.replace(/```json\n?/, '').replace(/\n?```/, '');
  } else if (content.startsWith('```')) {
    jsonStr = content.replace(/```\n?/, '').replace(/\n?```/, '');
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('AI response was not valid JSON');
  }
}

module.exports = { parseDocument };
