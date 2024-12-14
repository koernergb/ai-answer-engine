import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Function to check if string is a URL
function isValidUrl(string: string) {
 try {
   new URL(string);
   return true;
 } catch {
   return false;
 }
}

// Update the scraping function to return both content and a simplified URL for citations
async function scrapeUrl(url: string): Promise<{content: string, citationKey: string}> {
 // Create a simplified URL for citations (e.g., "wikipedia.org" instead of full URL)
 const urlObj = new URL(url);
 const citationKey = urlObj.hostname + urlObj.pathname;
 
 // Existing scraping logic
 if (url.includes('spa') || url.includes('app') || url.includes('dashboard')) {
   const browser = await puppeteer.launch({
     headless: 'new'
   });
   const page = await browser.newPage();
   await page.goto(url, { waitUntil: 'networkidle0' });
   const content = await page.content();
   await browser.close();
   
   const $ = cheerio.load(content);
   $('script, style, nav, footer, header').remove();
   return {
     content: $('body').text().trim(),
     citationKey
   };
 } else {
   const response = await fetch(url);
   const html = await response.text();
   const $ = cheerio.load(html);
   $('script, style, nav, footer, header').remove();
   return {
     content: $('body').text().trim(),
     citationKey
   };
 }
}

export async function POST(req: NextRequest) {
 try {
   const { message, history } = await req.json();
   
   // Update how we store context to include citation information
   let accumulatedContext = '';
   const citationMap = new Map<string, string>();

   // Gather context from history
   history.forEach((msg: any) => {
     if (msg.contextFromUrls) {
       accumulatedContext += msg.contextFromUrls.content + '\n';
       if (msg.contextFromUrls.citations) {
         Object.entries(msg.contextFromUrls.citations).forEach(([key, url]) => {
           citationMap.set(key, url as string);
         });
       }
     }
   });
   
   // Handle new URLs in current message
   const words = message.split(' ');
   let newContext = '';
   const newCitations: Record<string, string> = {};
   
   for (const word of words) {
     if (isValidUrl(word)) {
       try {
         const { content, citationKey } = await scrapeUrl(word);
         newContext += `\nContent from [${citationKey}]:\n${content}\n`;
         newCitations[citationKey] = word;
       } catch (error) {
         console.error(`Failed to scrape URL ${word}:`, error);
       }
     }
   }

   const fullContext = accumulatedContext + newContext;
   
   // Update the prompt to request citations
   const prompt = fullContext 
     ? `Format your response using Markdown syntax where appropriate.

When you use information from the provided URLs, cite your sources using [citation-key] format. I'll provide content with citation keys in square brackets.

Use all the following context to answer the user's questions:
${fullContext}

Important:
1. ALWAYS cite your sources using [citation-key] when using information from the provided URLs
2. Use Markdown for formatting, especially for code blocks and lists
3. If you're not sure about something, say so rather than making assumptions

User message: ${message}`
     : `Format your response using Markdown syntax where appropriate.

${message}`;

   // Send message to Gemini
   const chat = model.startChat({
     history: [],
     generationConfig: {
       temperature: 0.7,
       maxOutputTokens: 2048,
     },
   });

   const result = await chat.sendMessage(prompt);
   const response = result.response.text();
   
   // Parse markdown to HTML
   const parsedResponse = marked(response, {
     gfm: true,
     breaks: true,
     highlight: function (code, lang) {
       return code;
     }
   });

   return new Response(JSON.stringify({ 
     message: response,
     htmlContent: parsedResponse,
     contextFromUrls: {
       content: newContext,
       citations: newCitations
     }
   }), {
     headers: { 'Content-Type': 'application/json' },
   });

 } catch (error) {
   console.error('Error:', error);
   return new Response(JSON.stringify({ 
     error: 'Failed to process request',
     details: error instanceof Error ? error.message : 'Unknown error'
   }), { 
     status: 500,
     headers: { 'Content-Type': 'application/json' },
   });
 }
}