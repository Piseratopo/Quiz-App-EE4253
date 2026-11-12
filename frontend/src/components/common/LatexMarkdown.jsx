import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function LatexMarkdown({ content }) {
   const contentRef = useRef(null);

   useEffect(() => {
      const element = contentRef.current;
      const mathJax = globalThis.MathJax;
      if (!element || !mathJax?.startup?.promise) return;

      let isCurrent = true;
      mathJax.startup.promise
         .then(() => {
            if (isCurrent) return mathJax.typesetPromise([element]);
         })
         .catch((error) => console.error('MathJax render failed:', error));

      return () => {
         isCurrent = false;
         mathJax.typesetClear?.([element]);
      };
   }, [content]);

   if (!content) return null;
   return (
      <div className="markdown-latex-content" ref={contentRef}>
         <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
   );
}