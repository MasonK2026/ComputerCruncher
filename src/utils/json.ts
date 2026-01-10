export const deterministicStringify = (obj: any): string => {
    if (typeof obj !== 'object' || obj === null) {
        return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
        return JSON.stringify(obj.map(item => JSON.parse(deterministicStringify(item))));
    }

    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: Record<string, any> = {};

    for (const key of sortedKeys) {
        sortedObj[key] = typeof obj[key] === 'object' && obj[key] !== null
            ? JSON.parse(deterministicStringify(obj[key]))
            : obj[key];
    }

    return JSON.stringify(sortedObj);
};
