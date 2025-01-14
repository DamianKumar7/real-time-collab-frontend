export interface Document {
    ID: string;
    content: string;
    version: number;
    title: string;
}

export interface DocumentEvent {
    id: string;
    doc_id: string;
    user_id: string;
    operation: string;
    timestamp: string;
    position: number;
    length: number;
    content: string;
    version: number;
}

export interface BaseModel {
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt?: string;
}

export interface UserLoginResponse{
    token: string;
    message?: string;
    username?: string;
    userId: string;
}
export type DocumentModel = BaseModel & Document;
export type DocumentEventModel = BaseModel & DocumentEvent;