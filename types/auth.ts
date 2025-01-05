export interface User {
    id: string;
    email: string;
    name: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    name: string;
    confirmPassword: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}