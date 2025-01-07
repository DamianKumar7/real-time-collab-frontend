// components/document-editor.tsx

import { useState, useEffect, useCallback } from 'react';
import { User} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DocumentEvent } from '@/types';

interface DocumentEditorProps {
    docId: string;
    initialContent?: string;
    key?: string; // Add key prop type
}

export function DocumentEditor({ docId, initialContent = '' }: DocumentEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [version, setVersion] = useState(0);
    const [status, setStatus] = useState('connecting');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const userId = localStorage.getItem('userId') || 'default';

    // Reset content when initialContent changes
    useEffect(() => {
        setContent(initialContent);
    }, [initialContent]);

    useEffect(() => {
        let isSubscribed = true;
        // Close existing WebSocket connection before creating a new one
        if (ws) {
            ws.close();
        }

        const websocket = new WebSocket(`ws://localhost:8080/ws`);

        websocket.onopen = () => {
            if (!isSubscribed) return;
            setStatus('connecting'); // Set to connecting while joining
            websocket.send(JSON.stringify({
                doc_id: docId,
                user_id: userId,
                operation: "join",
                position: 0,
                length: 0,
                content: "",
                version: version,
                timestamp: new Date().toISOString()
            }));
        };

        websocket.onclose = () => {
            if (!isSubscribed) return;
            setStatus('disconnected');
        };

        websocket.onmessage = (event) => {
            if (!isSubscribed) return;
            try {
                const data: DocumentEvent = JSON.parse(event.data);
                if (data.content !== undefined) {
                    setContent(data.content);
                }
                if (data.version !== undefined) {
                    setVersion(data.version);
                }
                // Set connected status after successful join
                setStatus('connected');
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus('disconnected');
        };

        setWs(websocket);

        return () => {
            isSubscribed = false;
            websocket.close();
        };
    }, [docId]); // Recreate WebSocket connection when docId changes

    const sendChange = useCallback((operation: string, position: number, length: number = 0, content: string = '') => {
        if (!ws) return;

        const event: DocumentEvent = {
            id: '0',
            doc_id: docId.toString(),
            user_id: userId,
            operation: operation,
            position: position,
            length: length,
            content: content,
            version: version,
            timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(event));
    }, [ws, docId, userId, version]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        const diff = findDiff(content, newContent);
        
        if (diff) {
            sendChange(diff.operation, diff.position, diff.length, diff.content);
        }
        
        setContent(newContent);
    };

    const findDiff = (oldContent: string, newContent: string) => {
        if (oldContent === newContent) return null;
        
        let i = 0;
        while (i < oldContent.length && i < newContent.length && oldContent[i] === newContent[i]) {
            i++;
        }
        
        if (newContent.length > oldContent.length) {
            return {
                operation: 'insert',
                position: i,
                length: 0,
                content: newContent.slice(i, i + (newContent.length - oldContent.length))
            };
        } else {
            return {
                operation: 'delete',
                position: i,
                length: oldContent.length - newContent.length,
                content: ''
            };
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                    <CardTitle>Document Editor</CardTitle>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{userId}</span>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${
                            status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    Version: {version}
                </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)]">
                {status === 'connected' ? (
                    <textarea
                        className="w-full h-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={content}
                        onChange={handleChange}
                        placeholder="Start typing..."
                    />
                ) : (
                    <Alert>
                        <AlertDescription>
                            {status === 'connecting' ? 'Connecting to server...' : 'Failed to connect to server'}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}