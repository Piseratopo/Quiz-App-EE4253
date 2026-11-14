import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MAX_IMAGE_DIMENSION = 4096;

function parseImageDimension(value) {
   const dimension = Number(value);
   return Number.isInteger(dimension) && dimension > 0 && dimension <= MAX_IMAGE_DIMENSION
      ? dimension
      : undefined;
}

function getImageMetadata(alt, src) {
   const altMatch = /^(.*?)\s*\|\s*(\d{1,4})(?:\s*x\s*(\d{1,4}))?\s*$/i.exec(alt);
   let urlWidth;
   let urlHeight;

   try {
      const url = new URL(src, 'http://localhost');
      urlWidth = parseImageDimension(url.searchParams.get('width'));
      urlHeight = parseImageDimension(url.searchParams.get('height'));
   } catch {
      // Invalid or missing URLs are left for ReactMarkdown's default handling.
   }

   return {
      alt: altMatch ? altMatch[1].trim() : alt,
      width: parseImageDimension(altMatch?.[2]) ?? urlWidth,
      height: parseImageDimension(altMatch?.[3]) ?? urlHeight,
   };
}

export default function LatexMarkdown({ content }) {
   const contentRef = useRef(null);

   useEffect(() => {
      const element = contentRef.current;
      const mathJax = globalThis.MathJax;
      if (!element || !mathJax?.startup?.promise) return;

      let isCurrent = true;

      // Clear any previous MathJax typesetting on this element BEFORE re-rendering,
      // to prevent stale math from accumulating on top of new content.
      mathJax.typesetClear?.([element]);

      mathJax.startup.promise
         .then(() => {
            if (!isCurrent) return;
            return mathJax.typesetPromise([element]);
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
         <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
               img: ({ src, alt = '', title }) => {
                  const image = getImageMetadata(alt, src);
                  return (
                     <img
                        src={src}
                        alt={image.alt}
                        title={title}
                        width={image.width}
                        height={image.height}
                        loading="lazy"
                        decoding="async"
                     />
                  );
               },
            }}
         >
            {content}
         </ReactMarkdown>
      </div>
   );
}