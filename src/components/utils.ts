import { Client, Storage, Query, Functions } from "appwrite";
const projectId = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
const storageBucketId = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;
const functionId = import.meta.env.PUBLIC_APPWRITE_FUNCTION_ID;
const promptUrl = import.meta.env.PUBLIC_HUGCHAT_URL;

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(projectId);


const storage = new Storage(client);

const functions = new Functions(client);

const googleSearchEngineId = "76c9831068d474207";
const googleApiKey = "AIzaSyCoLAbWhN0E6mji5BskpCnJO51g0VmINMw";

function get(obj, path, defaultValue = '') {
return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? defaultValue;
}

export {
    client,
    functions,
    storage,
    projectId,
    storageBucketId,
    promptUrl,
    functionId,
    Query,
    googleSearchEngineId,
    googleApiKey,
    get
}