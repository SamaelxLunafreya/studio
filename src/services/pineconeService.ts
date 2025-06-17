
'use server';

import { Pinecone, type Index as PineconeIndexType, type RecordMetadata, type ServerlessRecord, type QueryResponse, type FetchResponse } from '@pinecone-database/pinecone';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const PINECONE_TEXT_FIELD = process.env.PINECONE_TEXT_FIELD_MAP || 'text';

if (!PINECONE_API_KEY) {
  throw new Error('Pinecone API key is not configured. Please set PINECONE_API_KEY in your .env file.');
}
if (!PINECONE_INDEX_NAME) {
  throw new Error('Pinecone index name is not configured. Please set PINECONE_INDEX_NAME in your .env file.');
}
if (!PINECONE_ENVIRONMENT) {
  throw new Error('Pinecone environment is not configured. Please set PINECONE_ENVIRONMENT in your .env file.');
}

let pineconeClientInstance: Pinecone | null = null;
let pineconeIndexInstance: PineconeIndexType<RecordMetadata> | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClientInstance) {
    pineconeClientInstance = new Pinecone({
      apiKey: PINECONE_API_KEY!,
    });
  }
  return pineconeClientInstance;
}

/**
 * Retrieves the initialized Pinecone index instance.
 * Ensures that the client and index are initialized only once.
 * @returns {Promise<PineconeIndexType<RecordMetadata>>} The Pinecone index instance.
 * @throws {Error} If PINECONE_INDEX_NAME is not configured.
 */
export async function getPineconeIndex(): Promise<PineconeIndexType<RecordMetadata>> {
  if (!pineconeIndexInstance) {
    const client = getPineconeClient();
    pineconeIndexInstance = client.Index(PINECONE_INDEX_NAME!);
  }
  return pineconeIndexInstance;
}

/**
 * Represents a record to be upserted to Pinecone where text embedding is handled by Pinecone.
 */
export interface TextRecordToEmbed {
  id: string;
  text: string;
  metadata?: RecordMetadata;
}

/**
 * Upserts text records to Pinecone. Pinecone will handle embedding the text
 * based on the index's configured model and text field map.
 * @param {TextRecordToEmbed[]} records - An array of records to upsert.
 * @param {string} [namespace] - Optional namespace to upsert records into.
 * @returns {Promise<void>}
 */
export async function upsertTextRecords(records: TextRecordToEmbed[], namespace?: string): Promise<void> {
  const index = await getPineconeIndex();

  const recordsToUpsert: ServerlessRecord<RecordMetadata>[] = records.map(r => {
    const recordPayload: any = { id: r.id };
    if (r.metadata) {
      recordPayload.metadata = r.metadata;
    }
    recordPayload[PINECONE_TEXT_FIELD] = r.text;
    return recordPayload as ServerlessRecord<RecordMetadata>;
  });

  if (namespace) {
    const ns = index.namespace(namespace);
    await ns.upsert(recordsToUpsert);
  } else {
    await index.upsert(recordsToUpsert);
  }
}

/**
 * Queries the Pinecone index using a vector.
 * @param {number[]} vector - The query vector.
 * @param {number} topK - The number of results to return.
 * @param {string} [namespace] - Optional namespace to query.
 * @param {RecordMetadata} [filter] - Optional filter to apply to the query.
 * @returns {Promise<QueryResponse<RecordMetadata>['matches'] | undefined>} A promise that resolves to the query matches.
 */
export async function queryByVector(vector: number[], topK: number, namespace?: string, filter?: RecordMetadata) {
  const index = await getPineconeIndex();

  const queryOptions: {
    vector: number[];
    topK: number;
    includeMetadata: boolean;
    filter?: RecordMetadata;
  } = {
    vector,
    topK,
    includeMetadata: true,
  };

  if (filter) {
    queryOptions.filter = filter;
  }

  let queryResponse: QueryResponse<RecordMetadata>;
  if (namespace) {
    const ns = index.namespace(namespace);
    queryResponse = await ns.query(queryOptions);
  } else {
    queryResponse = await index.query(queryOptions);
  }

  return queryResponse?.matches;
}

/**
 * Deletes records from Pinecone by their IDs.
 * @param {string[]} ids - An array of record IDs to delete.
 * @param {string} [namespace] - Optional namespace from which to delete records.
 * @returns {Promise<void>}
 */
export async function deleteRecordsByIds(ids: string[], namespace?: string): Promise<void> {
    const index = await getPineconeIndex();
    if (namespace) {
        const ns = index.namespace(namespace);
        await ns.deleteMany(ids);
    } else {
        await index.deleteMany(ids);
    }
}

/**
 * Fetches records from Pinecone by their IDs.
 * @param {string[]} ids - An array of record IDs to fetch.
 * @param {string} [namespace] - Optional namespace from which to fetch records.
 * @returns {Promise<FetchResponse<RecordMetadata>['records'] | undefined>} A promise that resolves to the fetched records.
 */
export async function fetchRecordsByIds(ids: string[], namespace?: string) {
    const index = await getPineconeIndex();
    let fetchedResponse: FetchResponse<RecordMetadata>;
    if (namespace) {
        const ns = index.namespace(namespace);
        fetchedResponse = await ns.fetch(ids);
    } else {
        fetchedResponse = await index.fetch(ids);
    }
    return fetchedResponse?.records;
}

/**
 * Retrieves statistics about the Pinecone index.
 * @returns {Promise<object>} A promise that resolves to the index statistics.
 */
export async function getPineconeIndexStats(): Promise<object> {
    const index = await getPineconeIndex();
    return await index.describeIndexStats();
}

/**
 * Checks if the Pinecone service is configured and reachable.
 * @returns {Promise<boolean>} True if configured and reachable, false otherwise.
 */
export async function checkPineconeServiceStatus(): Promise<boolean> {
  try {
    const stats = await getPineconeIndexStats();
    // Check if stats is not null and totalRecordCount exists
    if (stats && (stats as any).totalRecordCount !== undefined) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error connecting to Pinecone or fetching stats:', error);
    return false;
  }
}
