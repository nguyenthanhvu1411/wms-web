import { useState } from 'react';
import { Upload, X, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  title?: string;
}

export const ExcelUploadModal = ({ isOpen, onClose, onUpload, title = "Upload Excel" }: ExcelUploadModalProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
      setFile(selectedFile);
    } else {
      toast.error('Vui lòng chọn file Excel (.xlsx, .xls)');
    }
  };

  const handleConfirm = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-danger hover:bg-danger/10 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : file ? 'border-success bg-success/5' : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('excel-upload')?.click()}
          >
            <label htmlFor="excel-upload" className="sr-only">Tải lên file Excel</label>
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleChange}
            />
            
            {file ? (
              <>
                <FileSpreadsheet size={48} className="text-success mb-3" />
                <p className="text-sm font-medium text-text-primary">{file.name}</p>
                <p className="text-xs text-text-secondary mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <Upload size={48} className="text-primary/50 mb-3" />
                <p className="text-sm font-medium text-text-primary mb-1">Kéo thả file Excel vào đây</p>
                <p className="text-xs text-text-secondary">hoặc click để chọn file (.xlsx, .xls)</p>
              </>
            )}
          </div>
          
          <div className="mt-4 flex justify-between items-center text-sm">
            <a href="/templates/OpeningStock_Template.xlsx" className="text-primary hover:underline font-medium" onClick={(e) => {
                e.stopPropagation();
                toast.success('Đang tải file mẫu...');
            }}>
              Tải file mẫu
            </a>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-border bg-background/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-text-secondary hover:bg-background-hover rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!file}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};
