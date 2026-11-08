import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

export default function LatexMarkdown({ content }) {
   if (!content) return null;
   return (
      <div className="markdown-latex-content">
         <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
         >
            {content}
         </ReactMarkdown>
      </div>
   );
}