export interface Entry {
    id: number;
    name: string;
    path: string;
    hash: string;
    type: number;
};

export interface Response {
    status: number;
    message: string;
    data: Entry[];
};

export enum Status {
    ERROR = 0,
    FUZZY_SEARCH = 101,
    FOUND = 200
};

export interface SearchResult {
    status: Status;
    keywords: string[]; // If Status is FUZZY_SEARCH
    entry: Entry; // If Status is FOUND
    error_msg: string; // If Status is ERROR
};

export interface ImageResult {
    image: string;
    error_msg: string;
};

export interface UserState {
    keywords: string[];
    last_search_time: number;
    no_cache: boolean;
};
