export const getTotalPage = (page: number, size: number, totalItem: number) => {
    let end = size - 1;
    let start = 0;
    if (page > 1) {
        end = size * page - 1;
        start = end - (size - 1);
    }
    let totalPage = Math.ceil(totalItem / size);
    return totalPage;
};

export const getToken = (req: Request): string => {
    const authorization = req.headers['authorization'];
    if (!authorization) {
        return undefined;
    }
    return authorization.replace(/[Bb]earer /, '');
};