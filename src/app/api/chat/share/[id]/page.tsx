"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function SharedConversationPage() {
  const params = useParams();
  const [conversation, setConversation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedConversation = async () => {
      try {
        const response = await fetch(`/api/share?id=${params.id}`);
        if (!response.ok) throw new Error('Conversation not found');
        
        const data = await response.json();
        setConversation(data);
      } catch (err) {
        setError('Unable to load shared conversation');
        console.error(err);
      }
    };

    if (params.id) {
      fetchSharedConversation();
    }
  }, [params.id]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!conversation) return <div className="p-4">Loading...</div>;

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-4">Shared Conversation</h1>
        <div className="space-y-4">
          {conversation.messages.map((msg: any, index: number) => (
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
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}