import { useState } from 'react';
import { Share2, Copy } from 'lucide-react';

type ShareButtonProps = {
  messages: any[];
  contextFromUrls?: any;
};

export default function ShareButton({ messages, contextFromUrls }: ShareButtonProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    try {
      console.log('Sharing conversation:', { messages, contextFromUrls });
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, contextFromUrls })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const responseText = await response.text();
        console.error('Server response:', responseText);
        console.error('Failed to generate share link:', response.status, errorData);
        throw new Error(`Failed to generate share link: ${response.status} - ${errorData.error}`);
      }

      const { shareId } = await response.json();
      console.log('Received share ID:', shareId);
      const fullShareLink = `${window.location.origin}/share/${shareId}`;
      
      setShareLink(fullShareLink);
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to create share link');
    }
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleShare}
        className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center"
      >
        <Share2 className="mr-2" size={16} /> Share
      </button>

      {shareLink && (
        <div className="absolute z-10 mt-2 bg-white border rounded shadow-lg p-2 flex">
          <input 
            type="text" 
            readOnly 
            value={shareLink} 
            className="mr-2 px-2 py-1 border rounded flex-grow" 
          />
          <button 
            onClick={copyLink}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            {isCopied ? 'Copied!' : <Copy size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}