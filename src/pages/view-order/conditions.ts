export const CONDITIONS_OF_SALE = [
  {
    heading: "CONDITIONS OF SALE FOR PPC ZIMBABWE LIMITED",
    paragraphs: ["(‘Herein referred to as PPCZ’)"],
  },
  {
    heading: "1. PURPOSE OF SELLING CONDITIONS",
    paragraphs: [
      "1.1 These terms and conditions shall apply to any contract for the sale of any product or service by PPCZ, whether that contract arises out of:",
      "1.1.1 Any offer made by PPCZ and accepted by the customer, or",
      "1.1.2 Any offer made by the customer and accepted by PPCZ including any such offer made by the customer in response to a Quotation/Proforma invoice from PPCZ.",
      "1.2 No alteration or variation of these terms and conditions shall be valid, either at the time that contract is concluded or at any time afterwards, unless the alteration or variation in question is expressly agreed to in writing and signed by an authorised representative of PPCZ at the time in question.",
      "1.3 The customer is referred to the full detailed general terms and conditions on the PPCZ website:",
      "1.4 Save as may be specified on any Quotation or Proforma Invoice, prices are not subject to any further discount and are applicable to deliveries made during normal working hours, from Monday to Friday.",
      "1.5 All prices are subject to change at any time without prior notice and PPCZ shall not be bound by any quotation issued which is older than 24 hours.",
      "1.6 All products are supplied at the prices ruling on the date of despatch from the factory and not in terms of earlier quotations at the date of order irrespective of the method of delivery except if:",
      "1.6.1 The customer makes payment for the product within 24 hours of the validity of the quotation and",
      "1.6.2 The customer produces proof of payment to PPCZ within 48 hours and collects or takes delivery of the products within 72 hours of such payment;",
      "1.6.3 Exceptions on delivery time shall be made for bulk purchase customers, CPMs and Major Project orders.",
      "1.7 Should the customer fail to produce such proof of payment within 48 hours, the quotation becomes invalid.",
      "1.8 Should the customers fail to collect or take delivery of the product within the 72 hours of payment, PPCZ shall refund the amount sent by the customer through the same account that sent the funds to PPCZ with or without notice.",
      "Such refund shall be less bank transaction charges and IMTT charges. A customer may opt to accept delivery or collection of the product at the ruling prices on the day of collection or delivery.",
      "1.9 When making payment, the customer shall;",
      "1.9.1 clearly indicate the name of the customer (even if the payment is on behalf of the customer by another person),",
      "1.9.2 include the quotation number as a reference.",
      "1.10 The customer shall have no claim whatsoever against PPCZ either in contract, delict or under any enactment in the event of failure to interpret these conditions of sale.",
      "1.11 PPCZ reserves the right in its absolute discretion to suspend supply of its products either wholly or partially as a result of:",
      "a) Fire, accidents, storm or unforeseen circumstances beyond the control of PPCZ, Act of God, breakdown of machinery or vehicle, strikes, lockouts, Government order, war or commotion;",
      "b) Inability to obtain railway wagon or other vehicles, raw material, fuel or packaging materials;",
      "c) Or any circumstances beyond the direct control of PPCZ.",
      "The Customer shall be deemed to have read, understood and agreed with these conditions of sale by virtue of making a payment for the product to PPCZ",
    ],
  },
  {
    heading: "PAYMENT AND BANK DETAILS",
    paragraphs: [
      "Payment required in advance in form of either RTGS Bank transfer or direct cash deposit. Bank details as follows;",
      "BANK: STANBIC\nNAME: PPC ZIMBABWE LTD\nBRANCH: JMN NKOMO STREET\nACCOUNT NO: 914000088817",
      "BANK: ECOBANK\nNAME: PPC ZIMBABWE LTD\nBRANCH: PARKADE CENTRE\nACCOUNT NO: 578360005715",
      "BANK: CBZ\nNAME: PPC ZIMBABWE LTD\nBRANCH: 8TH AVE BULAWAYO\nACCOUNT NO: 04724363510057",
      "BANK: CABS\nNAME: PPC ZIMBABWE LTD\nBRANCH: Platinum\nACCOUNT NO: 1153141892",
      "BANK: NEDBANK\nNAME: PPC ZIMBABWE LTD\nBRANCH: JASON MOYO\nACCOUNT NO: 11990129578",
    ],
  },
  {
    heading: "IMPORTANT PAYMENT INSTRUCTION",
    paragraphs: [
      "When making a Bank Transfer, please ensure that you quote your Trading Name under the PAYMENT DETAILS SECTION so that your name appears on our Bank Statement.",
    ],
  },
  {
    heading: "CLOSING",
    paragraphs: [
      "We trust that our prices meet with your approval and look forward to a mutually rewarding relationship.",
      "PPC Zimbabwe Ltd\nN MAPUMA\nMANAGER SALES & MARKETING",
    ],
  },
] as const;

export const CONDITIONS_URL = "https://ppc.africa/zw/about-us/legal";

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;

  describe("Conditions of Sale content", () => {
    it("retains the complete supplied bank details and legal reference", () => {
      const content = CONDITIONS_OF_SALE.flatMap((section) => section.paragraphs).join("\n");
      expect(content).toContain("ACCOUNT NO: 914000088817");
      expect(content).toContain("ACCOUNT NO: 578360005715");
      expect(content).toContain("ACCOUNT NO: 04724363510057");
      expect(content).toContain("ACCOUNT NO: 1153141892");
      expect(content).toContain("ACCOUNT NO: 11990129578");
      expect(CONDITIONS_URL).toBe("https://ppc.africa/zw/about-us/legal");
    });
  });
}
