import { CONFIG } from "src/config";
// Assume you have a Redis client initialized and exported, e.g.:
import { redisInstance } from "src/redis"; // Path to your gateway's Redis client instance
import {
  type CreateInvoiceDocumentParams,
  MyInvoisClient,
  createDocumentSubmissionItemFromInvoice,
  type DocumentSubmissionItem,
} from "myinvois-client";
import type {
  GetRecentDocumentsRequestQuery,
  SubmitInvoiceDocumentsBody,
  SubmitInvoiceDocumentsQuery,
} from "src/schemes";

export async function getRecentDocuments(
  query: GetRecentDocumentsRequestQuery
) {
  const client = new MyInvoisClient(
    CONFIG.clientId,
    CONFIG.clientSecret,
    CONFIG.env,
    redisInstance
  );

  const { taxpayerTIN: taxpayerTIN, ...params } = query;
  try {
    const documents = await client.documents.getRecentDocuments(
      params,
      taxpayerTIN
    );
    return documents;
  } catch (error) {
    const action = taxpayerTIN
      ? `fetching documents for TIN ${taxpayerTIN}`
      : "fetching documents as taxpayer";
    // console.error(`MyInvois Gateway: Error during ${action}:`, error);
    throw new Error(
      `Failed during ${action}. Original error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function submitInvoices(
  query: SubmitInvoiceDocumentsQuery,
  body: SubmitInvoiceDocumentsBody
) {
  const client = new MyInvoisClient(
    CONFIG.clientId,
    CONFIG.clientSecret,
    CONFIG.env,
    redisInstance
  );

  const taxpayerTIN = query.taxpayerTIN;
  const _documents = body.documents;
  try {
    const documents: DocumentSubmissionItem[] = _documents.map((doc) => {
      return createDocumentSubmissionItemFromInvoice(
        doc as CreateInvoiceDocumentParams,
        "1.0"
      );
    });

    if (query.dryRun) return documents;
    const result = await client.documents.submitDocuments(
      { documents: documents },
      taxpayerTIN
    );
    return result;
  } catch (error) {
    const action = taxpayerTIN
      ? `submitting documents for TIN ${taxpayerTIN}`
      : "submitting documents as taxpayer";
    // console.error(`MyInvois Gateway: Error during ${action}:`, error);
    throw new Error(
      `Failed during ${action}. Original error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
