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

const SelfBilledRefundNoteLineSchema = CommonInvoiceLineSchema;

export const CreateSelfBilledRefundNoteDocumentSchema = Type.Object(
  {
    id: Type.String({
      description: "Unique identifier for the self-billed refund note.",
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
        "Specific currency for the e-Self-Billed Refund Note. E.g., “MYR”.",
      default: "MYR",
    }),
    taxCurrencyCode: Type.Optional(
      Type.String({
        description:
          "Optional. If not provided, defaults to `documentCurrencyCode`",
      })
    ),
    billingReferences: Type.Array(BillingReferenceSchema, { min: 1 }),
    supplier: SupplierSchema, // Represents the Seller (Receiver of SBRN - issued refund)
    customer: CustomerSchema, // Represents the Buyer (Issuer of SBRN - received refund)
    invoiceLines: Type.Array(SelfBilledRefundNoteLineSchema, {
      description:
        "List of items being refunded, at least one item is required.",
      minItems: 1,
    }),
    taxTotal: TaxTotalSchema,
    legalMonetaryTotal: LegalMonetaryTotalSchema,
    refundNotePeriod: Type.Optional(
      Type.Array(PeriodSchema, {
        description:
          "The period(s) to which the self-billed refund note applies, if applicable.",
      })
    ),
    additionalDocumentReferences: Type.Optional(
      Type.Array(AdditionalDocRefSchema)
    ),
    paymentMeans: Type.Optional(Type.Array(PaymentMeansSchema)),
    paymentTerms: Type.Optional(Type.Array(PaymentTermsSchema)),
    prepaidPayments: Type.Optional(Type.Array(PrepaidPaymentSchema)), // Useful for refund payment details
    allowanceCharges: Type.Optional(AllowanceChargeScheme), // Document level allowance/charges
  },
  {
    examples: [
      {
        id: "SBRN001",
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
          // Example Seller (Receiver of SBRN) data - same as SBI Seller
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
          // Example Buyer (Issuer of SBRN) data - same as SBI Buyer
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
            quantity: 1, // Refunding 1 unit
            unitPrice: 30.0,
            unitCode: "XUN",
            subtotal: 30.0, // 1 * 30.00
            itemDescription: "Refund for returned item from SBI",
            itemCommodityClassification: {
              code: "001",
              listID: "CLASS",
            },
            lineTaxTotal: {
              // Example tax details for the refunded amount
              taxAmount: 1.8, // 6% of 30.00 (assuming 6% Sales Tax)
              taxSubtotals: [
                {
                  taxableAmount: 30.0,
                  taxAmount: 1.8,
                  taxCategoryCode: "01", // Standard Rate (assuming Sales Tax)
                  percent: 6,
                },
              ],
            },
          },
        ],
        taxTotal: {
          // Example total tax for the refunded amount
          totalTaxAmount: 1.8,
          taxSubtotals: [
            {
              taxableAmount: 30.0,
              taxAmount: 1.8,
              taxCategoryCode: "01",
              percent: 6,
            },
          ],
        },
        legalMonetaryTotal: {
          // Example monetary total for the refund
          lineExtensionAmount: 30.0,
          taxExclusiveAmount: 30.0,
          taxInclusiveAmount: 31.8, // 30.00 + 1.80
          payableAmount: 31.8, // Amount being refunded (credited back to buyer)
        },
      },
    ],
  }
);

export type CreateSelfBilledRefundNoteDocument = Static<
  typeof CreateSelfBilledRefundNoteDocumentSchema
>;

export const SubmitSelfBilledRefundNoteDocumentsBodyScheme = Type.Object({
  documents: Type.Array(CreateSelfBilledRefundNoteDocumentSchema, {
    minItems: 1,
  }),
});

export type SubmitSelfBilledRefundNoteDocumentsBody = Static<
  typeof SubmitSelfBilledRefundNoteDocumentsBodyScheme
>;

export const SubmitSelfBilledRefundNoteDocumentsQueryScheme = Type.Composite([
  TaxpayerTINScheme, // Taxpayer TIN of the issuer (Buyer)
  DryRunScheme,
  SignScheme,
]);

export type SubmitSelfBilledRefundNoteDocumentsQuery = Static<
  typeof SubmitSelfBilledRefundNoteDocumentsQueryScheme
>;
