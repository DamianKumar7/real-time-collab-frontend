// components/document-list.tsx
import { Button } from '@/components/ui/button';
import { DocumentModel } from '@/types';
import { FileText } from 'lucide-react';

interface DocumentListProps {
  documents: DocumentModel[];
  onDocumentSelect: (docId: string) => void;
}

export function DocumentList({ documents, onDocumentSelect }: DocumentListProps) {
  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <FileText className="h-8 w-8 mb-2" />
        <p>No documents yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <Button
          key={doc.ID}
          variant="ghost"
          className="w-full justify-start text-left hover:bg-muted px-4"
          onClick={() => onDocumentSelect(doc.ID)}
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4" />
            <div>
              <p className="font-medium">Document {doc.ID}</p>
              <p className="text-xs text-muted-foreground">
                Last modified {new Date(doc.UpdatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}