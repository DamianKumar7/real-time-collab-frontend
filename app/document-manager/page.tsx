'use client';

import React, { useState, useEffect } from 'react';
import { DocumentList } from '@/components/document-list';
import { DocumentEditor } from '@/components/document-editor';
import { DocumentModel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { redirect } from 'next/navigation';

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentModel | null>(null);
  const [token, setToken] = useState<string | null>(null);
    
  const loggedIn = localStorage.getItem("token")
    if (!loggedIn) {
        redirect('/login')
    }

  // Effect to set token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
  }, []); 
  // Fetch documents with the token
  const fetchDocuments = async () => {
    if (!token) return; // Prevent fetch if token is not set yet

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
        console.log(data);
        console.log(documents);
    } catch (error) {
      console.error(error);
    } 
    };
    
    useEffect(() => {
        setLoading(false);
        console.log("documents")
        console.log(documents)
    },[documents])

  // Create a new document
  const createNewDocument = async () => {
    if (!token) return; // Prevent creating if token is not set yet

    try {
      const response = await fetch('http://localhost:8080/documents/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Add token to create request
        },
        body: JSON.stringify({ title: 'New Document', content: '', version: 1 }),
      });

      if (!response.ok) throw new Error('Failed to create document');
      await fetchDocuments(); // Refresh the document list
    } catch (error) {
      console.error(error);
    }
  };

  // Handle document selection
  const handleDocumentSelect = async (docId: string) => {
    if (!token) return; // Prevent selection if token is not set yet

      try {
        console.log("Trying to get the document by id")
        const response = await fetch(`http://localhost:8080/documents/get/${docId}`, {
            method: 'GET',
            headers: {
            'Authorization': `Bearer ${token}`,
            },
        });
      if (!response.ok) throw new Error('Failed to retrieve document');
          const data: DocumentModel = await response.json();
          console.log(data)
      setSelectedDocument(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch documents only after token is set
  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token]); // This runs when the token changes

 return (
    <div className="container mx-auto p-6 h-screen">
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-6rem)]">
        {/* Documents List Section */}
        <Card className="w-full md:w-1/3 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-2xl font-bold">Your Documents</CardTitle>
            <Button 
              onClick={createNewDocument}
              variant="default"
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Document
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <DocumentList
                  documents={documents}
                  onDocumentSelect={handleDocumentSelect}
                />
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Editor Section */}
        <Card className="w-full md:w-2/3 shadow-lg">
          <CardContent className="p-0 h-full">
            {selectedDocument ? (
              <DocumentEditor
                    key={selectedDocument.ID} // Add this line
                    docId={selectedDocument.ID}
                    initialContent={selectedDocument.content}
            />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                <p>No document selected</p>
                <Button 
                  onClick={createNewDocument}
                  variant="outline"
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Document
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
