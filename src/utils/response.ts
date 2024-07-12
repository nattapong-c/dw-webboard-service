export class Response {
    protected status: number;
    protected message: string;
    protected data?: any;

    public setMessage(message: string) {
        this.message = message;
        return this;
    }

    public setData(data: any) {
        this.data = data;
        return this;
    }
}