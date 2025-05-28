'use client'; 

import React, { FC, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useDroppable } from '@dnd-kit/core';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export interface DocumentViewerRef {
  getRenderedPageDimensions: () => { width: number; height: number } | null;
  getSignatureImageDimensions: () => { width: number; height: number } | null;
}

interface DocumentViewerProps {
  file: File | null;
  signatureImage?: string | null;
  signaturePosition?: { x: number; y: number } | null;
  droppableId?: string;
}

const WORD_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const WORD_EXTENSIONS = ['.doc', '.docx'];

const DocumentViewer = forwardRef<DocumentViewerRef, DocumentViewerProps>(
  (
    {
      file,
      signatureImage,
      signaturePosition,
      droppableId = 'document-viewer-droppable-area',
    },
    ref
  ) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const outerViewerRef = useRef<HTMLDivElement>(null);
    const pdfRenderAreaRef = useRef<HTMLDivElement>(null);
    const placedSignatureRef = useRef<HTMLImageElement>(null); 

    const { setNodeRef: droppableRef, isOver } = useDroppable({
      id: droppableId,
    });

    useImperativeHandle(ref, () => ({
      getRenderedPageDimensions: () => {
        if (pdfRenderAreaRef.current) {
          const pageElement = pdfRenderAreaRef.current.querySelector('.react-pdf__Page__canvas, .react-pdf__Page__svg');
          if (pageElement) {
            return {
              width: pageElement.clientWidth,
              height: pageElement.clientHeight,
            };
          }
          if(pdfRenderAreaRef.current.firstChild && pdfRenderAreaRef.current.firstChild instanceof HTMLElement) {
            return {
                width: pdfRenderAreaRef.current.firstChild.offsetWidth,
                height: pdfRenderAreaRef.current.firstChild.offsetHeight,
            }
          }
          return { 
            width: pdfRenderAreaRef.current.clientWidth,
            height: pdfRenderAreaRef.current.clientHeight,
          };
        }
        return null;
      },
      getSignatureImageDimensions: () => {
        if (placedSignatureRef.current) {
          return {
            width: placedSignatureRef.current.offsetWidth,
            height: placedSignatureRef.current.offsetHeight,
          };
        }
        return null;
      },
    }));
    
    const combinedDroppableRef = (node: HTMLDivElement | null) => {
        droppableRef(node);
        pdfRenderAreaRef.current = node;
    };

    useEffect(() => {
      setNumPages(null);
      setLoadError(null);
      setIsLoading(false);
    }, [file]);

    const onDocumentLoadSuccess = ({ numPages: nextNumPages }: any) => {
      setNumPages(nextNumPages);
      setIsLoading(false);
      setLoadError(null);
    };
    
    const onDocumentLoadError = (error: Error) => {
      console.error('Failed to load PDF:', error);
      setLoadError(`Failed to load PDF: ${error.message}. Ensure it's a valid PDF file.`);
      setIsLoading(false);
    };

    const onDocumentLoadProgress = ({ loaded, total }: { loaded: number, total: number}) => {
      if (!isLoading && !numPages && !loadError) {
        setIsLoading(true);
      }
    };
    
    const getPageWidth = () => {
        if (!outerViewerRef.current) return 600;
        const containerWidth = outerViewerRef.current.clientWidth;
        // Adjust for padding within the outerViewerRef if any, here we assume pdfRenderAreaRef is the direct child
        // For example, if outerViewerRef has p-4, its clientWidth is already reduced.
        return Math.min(800, containerWidth > 0 ? containerWidth : 600); // Use full width of the container up to 800px
    }

    const commonMessageStyles = "min-h-[300px] flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-center";

    if (!file) {
      return (
        <div 
          ref={outerViewerRef} 
          className={`${commonMessageStyles} border-slate-300 bg-slate-50`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-slate-600">Upload a document to view it.</p>
          <p className="text-sm text-slate-500">Supported formats: PDF, DOC, DOCX.</p>
        </div>
      );
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const isWordDocument = WORD_MIME_TYPES.includes(fileType) || WORD_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (isWordDocument) {
      return (
        <div 
          ref={outerViewerRef} 
          className={`${commonMessageStyles} border-amber-400 bg-amber-50 text-amber-700`}
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 3v6h6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h3l2-3-2-3h-3v6z" />
          </svg>
          <p className="text-lg font-medium">Word document viewing is not yet supported.</p>
          <p className="text-sm">Please upload a PDF to use the signature features.</p>
        </div>
      );
    }

    if (fileType !== 'application/pdf' && !fileName.endsWith('.pdf')) {
      return (
        <div 
          ref={outerViewerRef} 
          className={`${commonMessageStyles} border-red-400 bg-red-50 text-red-700`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-medium">Unsupported File Type.</p>
          <p className="text-sm">You uploaded: <span className="font-semibold">{fileName}</span></p>
          <p className="text-sm">Please upload a PDF, DOC, or DOCX file.</p>
        </div>
      );
    }

    // Styles for the PDF rendering area itself
    const pdfAreaBaseStyle = "relative w-full flex justify-center items-center transition-all duration-150 ease-in-out";
    const pdfAreaDroppableStyle = isOver 
        ? "outline-4 outline-dashed outline-sky-500/70 bg-sky-100/50 scale-[1.01]" 
        : "bg-slate-200"; // Background for the PDF viewing area

    return (
      <div 
        ref={outerViewerRef} 
        className="w-full h-full bg-slate-100 rounded-lg shadow-inner flex flex-col items-center justify-center p-1 sm:p-2" // Added padding for inner content
        style={{ minHeight: '400px' }} // Ensure outer viewer has min height
      >
        {isLoading && !loadError && (
          <div className={`${commonMessageStyles} border-sky-300`}>
            <svg className="animate-spin h-10 w-10 text-sky-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium text-sky-700">Loading PDF preview...</p>
          </div>
        )}
        {loadError && (
          <div className={`${commonMessageStyles} border-red-400 bg-red-50 text-red-700 animate-shake`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
            <p className="text-lg font-medium">PDF Load Error</p>
            <p className="text-sm break-all">{loadError}</p>
          </div>
        )}
        
        {/* PDF Rendering Area (Droppable) */}
        <div 
          ref={combinedDroppableRef} 
          className={`${pdfAreaBaseStyle} ${pdfAreaDroppableStyle} rounded-md overflow-hidden`}
          style={{ minHeight: numPages ? 'auto' : '300px' }} // Ensure droppable area has height even before PDF loads if file is present
        >
          {!loadError && file && !isLoading && ( // Only render Document if no error, file exists, and not initial loading
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              onLoadProgress={onDocumentLoadProgress}
              loading="" // Handled by isLoading state
              className="flex justify-center w-full"
              error="" // Handled by loadError state
            >
              {numPages && (
                <Page
                  pageNumber={1} // Only first page viewable for now
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg react-pdf__Page" // For querying dimensions
                  width={getPageWidth()}
                  canvasBackground="transparent" // Ensure canvas itself is transparent if needed
                />
              )}
            </Document>
          )}

          {/* Placed Signature Image */}
          {signatureImage && signaturePosition && (
            <div
              style={{
                position: 'absolute',
                left: `${signaturePosition.x}px`,
                top: `${signaturePosition.y}px`,
                zIndex: 10, // Ensure signature is on top
              }}
              className="pointer-events-none" // So it doesn't interfere with dragging over the PDF page itself
            >
              <img 
                  ref={placedSignatureRef} 
                  src={signatureImage} 
                  alt="Placed Signature" 
                  className="max-w-full h-auto opacity-80" // Example styling
                  style={{ maxHeight: '100px' }} // Consistent size
              />
            </div>
          )}
        </div>

        {numPages && !loadError && !isLoading && (
          <p className="mt-3 text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
            Page {1} of {numPages}
          </p>
        )}
      </div>
    );
  }
);

DocumentViewer.displayName = 'DocumentViewer';
export default DocumentViewer;
