import jsonServerProvider from 'ra-data-json-server';


const fetchWithCredentials = async (url: RequestInfo, options: RequestInit = {}) => {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...(options && typeof options.headers === 'object' ? options.headers : {}),
        },
    });
    const text = await response.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch {
        json = undefined;
    }
    return {
        status: response.status,
        headers: response.headers,
        body: text,
        json,
    };
};

export const dataProvider = jsonServerProvider(
    import.meta.env.VITE_JSON_SERVER_URL,
    fetchWithCredentials
);