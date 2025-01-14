// components/document-editor.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DocumentEvent } from '@/types';

interface DocumentEditorProps {
    docId: string;
    initialContent?: string;
    docVersion: number;
}

export function DocumentEditor({ docId, initialContent = '', docVersion }: DocumentEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [version, setVersion] = useState(docVersion);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const userId = localStorage.getItem('userId') || 'default';
    const wsRef = useRef<WebSocket | null>(null); // Ref to persist WebSocket instance

    // Logging helper
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const log = (message: string, ...data: any[]) => {
        console.log(`[DocumentEditor][docId=${docId}] ${message}`, ...data);
    };

    // Reset content when initialContent changes
    useEffect(() => {
        setContent(initialContent);
        log('Initial content set', { initialContent });
    }, [initialContent]);

    // Establish WebSocket connection once
    useEffect(() => {
        log('Initializing WebSocket connection...');
        const websocket = new WebSocket(`ws://localhost:8080/ws`);
        wsRef.current = websocket;

        // Set connecting status immediately
        setStatus('connecting');

            websocket.onopen = () => {
            log('WebSocket connection opened');
            setStatus('connected');  // Changed: Set connected here instead
            sendMessage({
                operation: 'join',  
                doc_id: String(docId),
                user_id: userId,
                version: version
            });
        };

        websocket.onmessage = (event) => {
            log('Received WebSocket message', event.data);
            try {
                const data: DocumentEvent = JSON.parse(event.data);
                if (data.content !== undefined) {
                    setContent(initialContent + data.content);
                    console.log("after recieving message from the server the updated content of the document is : {}",content)
                    log('Content updated from server', { content: data.content });
                }
                if (data.version !== undefined) {
                    setVersion(data.version);
                    log('Version updated from server', { version: data.version });
                }
            } catch (error) {
                console.error(`[DocumentEditor][docId=${docId}] Error processing WebSocket message`, error);
            }
        };

        websocket.onerror = (error) => {
            console.error(`[DocumentEditor][docId=${docId}] WebSocket error`, error);
            setStatus('disconnected');
        };

        websocket.onclose = (event) => {
            log('WebSocket connection closed', { code: event.code, reason: event.reason });
            setStatus('disconnected');
            wsRef.current = null;
        };

        // Cleanup function
        return () => {
            if (websocket.readyState === WebSocket.OPEN) {
                log('Cleaning up WebSocket connection...');
                websocket.close();
            }
            wsRef.current = null;
        };
    }, [docId]); // Added userId and version to dependencies

    const sendMessage = useCallback(
        (event: Partial<DocumentEvent>) => {
            const websocket = wsRef.current;
            if (!websocket || websocket.readyState !== WebSocket.OPEN) {
                log('WebSocket not ready, skipping message send', { event });
                return;
            }

            log('Sending WebSocket message', { event });
            websocket.send(
                JSON.stringify({
                    doc_id: String(docId),
                    user_id: userId,
                    timestamp: new Date().toISOString(),
                    ...event,
                })
            );
        },
        [docId, userId]
    );

    const sendChange = useCallback(
        (operation: string, position: number, length: number = 0, content: string = '') => {
            log('Preparing to send change event', { operation, position, length, content });
            sendMessage({ operation, position, length, content, version });
        },
        [sendMessage, version]
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        console.log("content is {}", content)
        const newContent = e.target.value;
        console.log("The new content is {}",newContent)
        const diff = findDiff(content, newContent);

        if (diff) {
            log('Detected content difference', { diff });
            sendChange(diff.operation, diff.position, diff.length, diff.content);
        }

        setContent(newContent);
        setVersion(version+1)
        log('Content updated locally', { newContent });
    };

    const findDiff = (oldContent: string, newContent: string) => {
        if (oldContent === newContent) return null;

        let i = 0;
        while (i < oldContent.length && i < newContent.length && oldContent[i] === newContent[i]) {
            i++;
        }

        if (newContent.length > oldContent.length) {
            const diff = {
                operation: 'insert',
                position: i,
                length: newContent.length - oldContent.length,
                content: newContent.slice(i),
            };
            log('Detected insert operation', { diff });
            return diff;
        } else {
            const diff = {
                operation: 'delete',
                position: i,
                length: oldContent.length - newContent.length,
                content: '',
            };
            log('Detected delete operation', { diff });
            return diff;
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
                        <div
                            className={`h-2 w-2 rounded-full ${
                                status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                        />
                    </div>
                </div>
                <div className="text-sm text-gray-500">Version: {version}</div>
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
                            {status === 'connecting'
                                ? 'Connecting to server...'
                                : 'Failed to connect to server'}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
