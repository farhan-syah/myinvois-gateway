import { type Static, Type } from "@sinclair/typebox";
import {
  AdditionalDocRefSchema,
  AllowanceChargeScheme,
  BillingReferenceSchema,
  CommonInvoiceLineSchema,
  CustomerSchema,
  DryRunScheme,
  LegalMonetaryTotalSchema,
  PaymentMeansSchema,
  PaymentTermsSchema,
  PeriodSchema,
  PrepaidPaymentSchema,
  SignScheme,
  SupplierSchema,
  TaxpayerTINScheme,
  TaxTotalSchema,
} from "../common";

const SelfBilledDebitNoteLineSchema = CommonInvoiceLineSchema;

export const CreateSelfBilledDebitNoteDocumentSchema = Type.Object(
  {
    id: Type.String({
      description: "Unique identifier for the self-billed debit note.",
      minLength: 1,
    }),
    issueDate: Type.String({
      format: "date",
      description: "The current date in UTC timezone (YYYY-MM-DD)",
    }),
    issueTime: Type.String({
      format: "time",
      description: "The current time in UTC timezone (hh:mm:ssZ)",
    }),
    documentCurrencyCode: Type.String({
      description:
        "Specific currency for the e-Self-Billed Debit Note. E.g., “MYR”.",
      default: "MYR",
    }),
    taxCurrencyCode: Type.Optional(
      Type.String({
        description:
          "Optional. If not provided, defaults to `documentCurrencyCode`",
      })
    ),
    billingReferences: Type.Array(BillingReferenceSchema, { min: 1 }),
    supplier: SupplierSchema, // Represents the Seller (Receiver of SBDN) - same as SBI Seller
    customer: CustomerSchema, // Represents the Buyer (Issuer of SBDN) - same as SBI Buyer
    invoiceLines: Type.Array(SelfBilledDebitNoteLineSchema, {
      description:
        "List of items being debited, at least one item is required.",
      minItems: 1,
    }),
    taxTotal: TaxTotalSchema,
    legalMonetaryTotal: LegalMonetaryTotalSchema,
    debitNotePeriod: Type.Optional(
      Type.Array(PeriodSchema, {
        description:
          "The period(s) to which the self-billed debit note applies, if applicable.",
      })
    ),
    additionalDocumentReferences: Type.Optional(
      Type.Array(AdditionalDocRefSchema)
    ),
    paymentMeans: Type.Optional(Type.Array(PaymentMeansSchema)),
    paymentTerms: Type.Optional(Type.Array(PaymentTermsSchema)),
    prepaidPayments: Type.Optional(Type.Array(PrepaidPaymentSchema)),
    allowanceCharges: Type.Optional(AllowanceChargeScheme), // Document level allowance/charges
  },
  {
    examples: [
      {
        id: "SBDN001",
        issueDate: new Date().toISOString().split("T")[0],
        issueTime: new Date().toISOString().substring(11, 16) + ":00Z",
        documentCurrencyCode: "MYR",
        billingReferences: [
          {
            uuid: "SBI001-LHDNM-UUID", // LHDNM UUID of the original Self-Billed Invoice
            internalId: "SBI001", // Internal ID of the original Self-Billed Invoice
          },
        ],
        supplier: {
          // Example Seller (Receiver of SBDN) data - same as SBI Seller
          TIN: "S1234567890",
          legalName: "Seller Company Sdn. Bhd.",
          identificationNumber: "201501012345",
          identificationScheme: "BRN",
          telephone: "+60312345678",
          industryClassificationCode: "46590", // Example MSIC
          industryClassificationName:
            "Wholesale of other machinery and equipment",
          address: {
            addressLines: ["Level 10, Example Building", "Jalan Contoh"],
            cityName: "Petaling Jaya",
            postalZone: "46050",
            countrySubentityCode: "10", // Selangor
            countryCode: "MYS",
          },
        },
        customer: {
          // Example Buyer (Issuer of SBDN) data - same as SBI Buyer
          TIN: "B0987654321",
          legalName: "Buyer Corporation Bhd.",
          identificationNumber: "201801054321",
          identificationScheme: "BRN",
          telephone: "+60398765432",
          address: {
            addressLines: ["Unit 5, Innovation Center", "Persiaran Maju"],
            cityName: "Cyberjaya",
            postalZone: "63000",
            countrySubentityCode: "10", // Selangor
            countryCode: "MYS",
          },
        },
        invoiceLines: [
          {
            id: "1",
            quantity: 2, // Debiting 2 additional units
            unitPrice: 10.0,
            unitCode: "XUN",
            subtotal: 20.0, // 2 * 10.00
            itemDescription: "Correction for understated quantity of Item ABC",
            itemCommodityClassification: {
              code: "001",
              listID: "CLASS",
            },
            lineTaxTotal: {
              // Example tax details for the debited amount
              taxAmount: 1.2, // 6% of 20.00 (assuming 6% Sales Tax)
              taxSubtotals: [
                {
                  taxableAmount: 20.0,
                  taxAmount: 1.2,
                  taxCategoryCode: "01", // Standard Rate (assuming Sales Tax)
                  percent: 6,
                },
              ],
            },
          },
        ],
        taxTotal: {
          // Example total tax for the debited amount
          totalTaxAmount: 1.2,
          taxSubtotals: [
            {
              taxableAmount: 20.0,
              taxAmount: 1.2,
              taxCategoryCode: "01",
              percent: 6,
            },
          ],
        },
        legalMonetaryTotal: {
          // Example monetary total for the debit
          lineExtensionAmount: 20.0,
          taxExclusiveAmount: 20.0,
          taxInclusiveAmount: 21.2, // 20.00 + 1.20
          payableAmount: 21.2, // Amount to be debited (added) to the amount owed to the seller
        },
      },
    ],
  }
);

export type CreateSelfBilledDebitNoteDocument = Static<
  typeof CreateSelfBilledDebitNoteDocumentSchema
>;

export const SubmitSelfBilledDebitNoteDocumentsBodyScheme = Type.Object({
  documents: Type.Array(CreateSelfBilledDebitNoteDocumentSchema, {
    minItems: 1,
  }),
});

export type SubmitSelfBilledDebitNoteDocumentsBody = Static<
  typeof SubmitSelfBilledDebitNoteDocumentsBodyScheme
>;

export const SubmitSelfBilledDebitNoteDocumentsQueryScheme = Type.Composite([
  TaxpayerTINScheme, // Taxpayer TIN of the issuer (Buyer)
  DryRunScheme,
  SignScheme,
]);

export type SubmitSelfBilledDebitNoteDocumentsQuery = Static<
  typeof SubmitSelfBilledDebitNoteDocumentsQueryScheme
>;
