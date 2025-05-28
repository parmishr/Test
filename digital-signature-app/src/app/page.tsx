'use client';

import React, { useState, useRef } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import FileUpload from '@/components/FileUpload';
import DocumentViewer, { DocumentViewerRef } from '@/components/DocumentViewer';
import SignaturePad from '@/components/SignaturePad';
import DraggableSignature from '@/components/DraggableSignature';
import { applySignatureToPdf } from '@/lib/pdfUtils'; 

const DRAGGABLE_SIGNATURE_ID = 'draggable-signature';
const DOCUMENT_VIEWER_DROPPABLE_ID = 'document-viewer-droppable-area';

export default function HomePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number } | null>(null);
  
  const [modifiedPdfData, setModifiedPdfData] = useState<Uint8Array | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState<boolean>(false);
  const [pdfProcessingError, setPdfProcessingError] = useState<string | null>(null);

  const documentViewerRef = useRef<DocumentViewerRef>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, 
      },
    })
  );

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setSignatureImage(null);
    setSignaturePosition(null);
    setFileError(null);
    setModifiedPdfData(null);
    setPdfProcessingError(null);
  };

  const handleFileError = (error: string) => {
    setFileError(error);
    setUploadedFile(null);
    setSignatureImage(null);
    setSignaturePosition(null);
    setModifiedPdfData(null);
    setPdfProcessingError(null);
  };

  const handleSignatureSave = (image: string) => {
    setSignatureImage(image);
    setModifiedPdfData(null); 
    setPdfProcessingError(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    if (active.id === DRAGGABLE_SIGNATURE_ID && over && over.id === DOCUMENT_VIEWER_DROPPABLE_ID) {
      setSignaturePosition((prevPosition) => ({
        x: Math.max(0, (prevPosition ? prevPosition.x : 0) + delta.x),
        y: Math.max(0, (prevPosition ? prevPosition.y : 0) + delta.y),
      }));
      setModifiedPdfData(null); 
      setPdfProcessingError(null);
    }
  };

  const handleApplySignature = async () => {
    if (!uploadedFile || !signatureImage || !signaturePosition || !documentViewerRef.current) {
      setPdfProcessingError("Missing file, signature, position, or document viewer reference.");
      return;
    }

    const viewerPageInfo = documentViewerRef.current.getRenderedPageDimensions();
    const signatureDisplaySize = documentViewerRef.current.getSignatureImageDimensions();

    if (!viewerPageInfo || !signatureDisplaySize) {
      setPdfProcessingError("Could not get dimensions from the document viewer or signature image.");
      return;
    }
    
    if (signatureDisplaySize.width === 0 || signatureDisplaySize.height === 0) {
        setPdfProcessingError("Signature image dimensions are zero. Ensure the image is visible.");
        return;
    }

    setIsProcessingPdf(true);
    setPdfProcessingError(null);
    setModifiedPdfData(null);

    try {
      const modifiedPdf = await applySignatureToPdf(
        uploadedFile,
        signatureImage,
        signaturePosition,
        viewerPageInfo,
        signatureDisplaySize
      );

      if (modifiedPdf) {
        setModifiedPdfData(modifiedPdf);
      } else {
        setPdfProcessingError("Failed to apply signature to PDF. The PDF might be corrupted or unsupported.");
      }
    } catch (error) {
      console.error("Error in handleApplySignature:", error);
      setPdfProcessingError(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessingPdf(false);
    }
  };
  
  const handleDownloadPdf = () => {
    if (modifiedPdfData && uploadedFile) {
      const blob = new Blob([modifiedPdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const originalName = uploadedFile.name.substring(0, uploadedFile.name.lastIndexOf('.')) || uploadedFile.name;
      a.download = `${originalName}-signed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const resetStateForNewDocument = () => {
    setUploadedFile(null);
    setSignatureImage(null);
    setSignaturePosition(null);
    setFileError(null);
    setModifiedPdfData(null);
    setPdfProcessingError(null);
  };

  const canApplySignature = uploadedFile && signatureImage && signaturePosition && !modifiedPdfData;
  const showDraggableSignature = signatureImage && !signaturePosition && !modifiedPdfData;
  const showRepositionButton = signatureImage && signaturePosition && !modifiedPdfData;


  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 p-4 sm:p-6 lg:p-8 font-sans">
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-700 tracking-tight">
            Digital Document Signer
          </h1>
          <p className="mt-2 text-sm text-slate-500">Upload, sign, and download your documents with ease.</p>
        </header>

        {/* File Upload Section */}
        <section className="mb-8 p-6 bg-white shadow-xl rounded-xl max-w-2xl mx-auto">
          <FileUpload onFileSelect={handleFileSelect} onError={handleFileError} />
          {fileError && (
            <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg shadow-sm animate-shake">
              <strong className="font-semibold">Upload Error:</strong> {fileError}
            </div>
          )}
        </section>

        {/* Main Content Area: Document Viewer and Signature Pad */}
        <main className="flex flex-col lg:flex-row gap-8">
          {/* Document Viewer Section */}
          <section className="lg:flex-1 w-full lg:min-w-[60%]">
            <div className="p-2 sm:p-4 bg-white shadow-xl rounded-xl min-h-[500px] flex flex-col">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-4 text-center border-b pb-3">Document Preview</h2>
              <div className="flex-grow relative rounded-md overflow-hidden">
                <DocumentViewer
                  ref={documentViewerRef}
                  file={uploadedFile}
                  signatureImage={signatureImage}
                  signaturePosition={signaturePosition}
                  droppableId={DOCUMENT_VIEWER_DROPPABLE_ID}
                />
              </div>
            </div>
          </section>

          {/* Signature Pad & Actions Section */}
          <aside className="lg:w-1/3 w-full space-y-6">
            <div className="p-6 bg-white shadow-xl rounded-xl">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-4 text-center border-b pb-3">Add Your Signature</h2>
              <SignaturePad onSave={handleSignatureSave} />
              
              {showDraggableSignature && (
                <div className="mt-6 p-4 border-2 border-dashed border-sky-300 rounded-lg bg-sky-50 text-center animate-fadeIn">
                  <h3 className="text-md font-semibold text-sky-700 mb-2">Drag Your Signature</h3>
                  <div className="flex justify-center">
                    <DraggableSignature
                      id={DRAGGABLE_SIGNATURE_ID}
                      signatureImage={signatureImage!} // Known to be non-null here
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Drag the signature image onto the document preview.</p>
                </div>
              )}

              {showRepositionButton && (
                 <div className="mt-6 p-4 border border-amber-300 rounded-lg bg-amber-50 text-center animate-fadeIn">
                  <p className="text-sm text-amber-700 font-semibold">Signature Placed!</p>
                  <p className="text-xs text-gray-600 mt-1">You can adjust its position by dragging it, or reposition/remove it.</p>
                  <button 
                    onClick={() => {
                        setSignaturePosition(null); 
                        setModifiedPdfData(null); 
                        setPdfProcessingError(null);
                    }}
                    className="mt-3 px-4 py-2 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all duration-150 ease-in-out"
                  >
                    Reposition/Remove
                  </button>
                </div>
              )}
            </div>

            {/* Actions Section */}
            {(canApplySignature || modifiedPdfData || pdfProcessingError) && (
              <div className="p-6 bg-white shadow-xl rounded-xl space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 text-center mb-3">Finalize & Download</h3>
                {canApplySignature && !modifiedPdfData && (
                  <button
                    onClick={handleApplySignature}
                    disabled={isProcessingPdf}
                    className="w-full px-6 py-3 text-base font-semibold text-white rounded-lg shadow-md transition-all duration-150 ease-in-out
                              bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                              disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isProcessingPdf ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : 'Apply Signature & Finalize'}
                  </button>
                )}

                {pdfProcessingError && (
                  <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg shadow-sm animate-shake">
                    <strong className="font-semibold">Processing Error:</strong> {pdfProcessingError}
                  </div>
                )}

                {modifiedPdfData && (
                  <div className="p-4 border border-green-400 rounded-lg bg-green-50 text-center animate-fadeIn space-y-3">
                    <h3 className="text-lg font-semibold text-green-700">Document Signed Successfully!</h3>
                    <p className="text-sm text-slate-600">Your signed PDF is ready for download.</p>
                    <button
                      onClick={handleDownloadPdf}
                      className="w-full px-6 py-3 text-base font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-150 ease-in-out"
                    >
                      Download Signed PDF
                    </button>
                    <button 
                      onClick={resetStateForNewDocument}
                      className="w-full px-6 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all duration-150 ease-in-out"
                    >
                      Sign Another Document
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        </main>

        <footer className="mt-12 pt-8 border-t border-slate-300 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Digital Signature App. Crafted with Tailwind CSS.</p>
        </footer>
      </div>
    </DndContext>
  );
}
