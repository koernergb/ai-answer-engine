"use client";

import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ShareButton from '@/components/ShareButton';

type Message = {
  role: "user" | "ai";
  content: string;
  htmlContent?: string;
  contextFromUrls?: {
    content: string;
    citations: Record<string, string>;
  };
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "ai", 
      content: "Hello! I can help answer your questions. You can share URLs with me and I'll analyze their content to provide better answers with citations.", 
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to convert citations in markdown to links with tooltips
  const processMarkdownWithCitations = (content: string, citations?: Record<string, string>) => {
    if (!citations) return content;
    
    // Replace citation keys with tooltips
    Object.entries(citations).forEach(([key, url]) => {
      const citationPattern = new RegExp(`\\[${key}\\]`, 'g');
      content = content.replace(citationPattern, `[${key}](tooltip:${url})`);
    });
    
    return content;
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user" as const, content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message,
          history: messages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage = { 
        role: "ai" as const, 
        content: data.message,
        htmlContent: data.htmlContent,
        contextFromUrls: data.contextFromUrls
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 p-4 sm:p-6 justify-between flex flex-col h-screen">
        <div className="flex flex-col space-y-4 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch mb-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-xl px-4 py-2 rounded-lg shadow ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                }`}
              >
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      a({node, href, children}) {
                        if (href?.startsWith('tooltip:')) {
                          const url = href.replace('tooltip:', '');
                          return (
                            <span className="group relative">
                              <span className="font-medium text-blue-400 cursor-help">
                                {children}
                              </span>
                              <span className="pointer-events-none absolute -top-7 left-0 w-max opacity-0 transition-opacity group-hover:opacity-100 bg-black text-white text-xs rounded py-1 px-2">
                                Source: {url}
                              </span>
                            </span>
                          );
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                      }
                    }}
                  >
                    {processMarkdownWithCitations(msg.content, msg.contextFromUrls?.citations)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-3 w-3 bg-gray-200 dark:bg-gray-600 rounded-full animate-bounce"></div>
                  <div className="h-3 w-3 bg-gray-200 dark:bg-gray-600 rounded-full animate-bounce delay-100"></div>
                  <div className="h-3 w-3 bg-gray-200 dark:bg-gray-600 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-4 pt-4 mb-2 sm:mb-0 flex justify-between items-center">
          <div className="relative flex flex-1 mr-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message or paste a URL to analyze..."
              className="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 dark:text-gray-200 placeholder-gray-600 dark:placeholder-gray-400 pl-4 bg-gray-100 dark:bg-gray-700 rounded-md py-3"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-600 focus:outline-none ml-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="animate-pulse">Sending...</span>
              ) : (
                <span>Send</span>
              )}
            </button>
          </div>
          <ShareButton 
            messages={messages} 
            contextFromUrls={messages.find(m => m.contextFromUrls)?.contextFromUrls} 
          />
        </div>
      </div>
    </main>
  );
}