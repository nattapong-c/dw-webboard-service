export interface User {
    username: string;
    picture?: string;
}

export interface UserModel extends User {
    _id: string;
    created_at: Date;
    updated_at: Date;
}