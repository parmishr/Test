import React, { ChangeEvent, FC } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
}

const ALLOWED_TYPES = [
  'application/pdf',
  '.pdf',
  'application/msword',
  '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.docx',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FileUpload: FC<FileUploadProps> = ({ onFileSelect, onError }) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    // const fileExtension = fileName.substring(fileName.lastIndexOf('.')); // Not directly used with current ALLOWED_TYPES check

    const isAllowedType = ALLOWED_TYPES.includes(fileType) || ALLOWED_TYPES.some(type => fileName.endsWith(type));

    if (!isAllowedType) {
      const allowedExtensions = ALLOWED_TYPES.filter(t => t.startsWith('.')).join(', ');
      onError(`Invalid file type. Allowed: ${allowedExtensions}. You uploaded: ${fileName}`);
      event.target.value = ''; 
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError(`File "${fileName}" is too large (${(file.size / (1024*1024)).toFixed(2)}MB). Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      event.target.value = '';
      return;
    }

    onFileSelect(file);
    event.target.value = ''; 
  };

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className="block text-sm font-medium text-slate-700 mb-2"
      >
        Select Document (PDF, DOC, DOCX - Max 10MB)
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-sky-500 transition-colors duration-150 ease-in-out">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-slate-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            <p className="pl-1">or drag and drop</p> {/* Drag and drop is not implemented, but it's a common UI text */}
          </div>
          <p className="text-xs text-slate-500">PDF, DOC, DOCX up to 10MB</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
