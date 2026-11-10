"use client";
import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import ShippingRateSelector from "@/components/shipping/ShippingRateSelector";
import type { ShippingRate } from "@/types/shipping";
import {
  STORE_ORIGIN,
  DEFAULT_PACKAGE,
  applyShippingServiceFee,
} from "@/lib/shipping-config";
import { cartEvents } from "@/hooks/useCart";
import ClassicSidebar from "@/components/ui/ClassicSidebar";
import type { NavCategory } from "@/lib/getNavCategories";

interface ShippingForm {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

const EMPTY_FORM: ShippingForm = {
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  phone: "",
};

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "CH", name: "Switzerland" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
];

const US_STATES = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
  ["DC", "Washington D.C."],
];

const CA_PROVINCES = [
  ["AB", "Alberta"],
  ["BC", "British Columbia"],
  ["MB", "Manitoba"],
  ["NB", "New Brunswick"],
  ["NL", "Newfoundland and Labrador"],
  ["NS", "Nova Scotia"],
  ["NT", "Northwest Territories"],
  ["NU", "Nunavut"],
  ["ON", "Ontario"],
  ["PE", "Prince Edward Island"],
  ["QC", "Quebec"],
  ["SK", "Saskatchewan"],
  ["YT", "Yukon"],
];

const IN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const POSTAL_PATTERNS: Record<string, { pattern: RegExp; hint: string }> = {
  US: { pattern: /^\d{5}(-\d{4})?$/, hint: "12345 or 12345-6789" },
  CA: { pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, hint: "A1B 2C3" },
  GB: {
    pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/,
    hint: "SW1A 1AA",
  },
  AU: { pattern: /^\d{4}$/, hint: "2000" },
  IN: { pattern: /^\d{6}$/, hint: "110001" },
};

type FormErrors = Partial<Record<keyof ShippingForm, string>>;

function validateForm(form: ShippingForm, pinVerified: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!form.fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (!/^[A-Za-z\u00C0-\u024F\s'\-]{2,}$/.test(form.fullName.trim())) {
    errors.fullName = "Letters, spaces and hyphens only";
  } else if (form.fullName.trim().split(/\s+/).length < 2) {
    errors.fullName = "Please enter first and last name";
  }
  if (!form.addressLine1.trim()) {
    errors.addressLine1 = "Street address is required";
  } else if (form.addressLine1.trim().length < 5) {
    errors.addressLine1 = "Enter a complete street address";
  }
  if (!form.city.trim() && !pinVerified) {
    errors.city = "City is required";
  } else if (
    form.city.trim() &&
    !pinVerified &&
    !/^[A-Za-z\u00C0-\u024F\s'\-\.]{2,}$/.test(form.city.trim())
  ) {
    errors.city = "Enter a valid city name";
  }
  if (
    (form.country === "US" || form.country === "CA" || form.country === "IN") &&
    !form.state
  ) {
    errors.state =
      form.country === "CA" ? "Province is required" : "State is required";
  }
  if (!form.postalCode.trim()) {
    errors.postalCode = "Postal code is required";
  } else {
    const rule = POSTAL_PATTERNS[form.country];
    if (rule && !rule.pattern.test(form.postalCode.trim())) {
      errors.postalCode = `Expected format: ${rule.hint}`;
    }
  }
  if (!form.country) {
    errors.country = "Please select a country";
  }
  if (!form.phone.trim()) {
    errors.phone = "Phone number is required";
  } else {
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      errors.phone = "Enter a valid phone number (7–15 digits)";
    }
  }
  return errors;
}

function formatPhone(raw: string, country: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 15);
  if (country === "IN") {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

const LABELS: Record<keyof ShippingForm, string> = {
  fullName: "Full Name",
  addressLine1: "Street Address",
  addressLine2: "Apt / Suite / Unit",
  city: "City / District",
  state: "State / Province",
  postalCode: "Pincode / Postal Code",
  country: "Country",
  phone: "Phone Number",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckMark = () => (
  <span className="co-ok" aria-hidden="true">✓</span>
);

const Spinner = () => <span className="co-spinner" aria-hidden="true" />;

// ─── Sub-components ────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="co-field-err">{msg}</p>;
}

function PincodeBanner({
  postOffices,
  onSelect,
}: {
  postOffices: { Name: string; District: string; State: string }[];
  onSelect: (po: { Name: string; District: string; State: string }) => void;
}) {
  if (!postOffices.length) return null;
  return (
    <div className="co-po">
      <p className="co-po-head">
        {postOffices.length} area{postOffices.length > 1 ? "s" : ""} found —
        select yours
      </p>
      <div className="co-po-list">
        {postOffices.map((po, i) => (
          <button key={i} type="button" onClick={() => onSelect(po)} className="co-po-item">
            <strong>{po.Name}</strong>
            <span>
              {po.District}, {po.State}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TrustBadges() {
  return (
    <ul className="co-trust">
      {["SSL Secured Checkout", "Free Insured Shipping", "4.9★ Rated by 2,400+"].map((label) => (
        <li key={label}>{label}</li>
      ))}
    </ul>
  );
}

function OrderSummary({ total, shippingRate, couponDiscount = 0 }: { total: number; shippingRate: ShippingRate | null; couponDiscount?: number }) {
  const rawShipping = shippingRate?.rate ?? 0;
  const serviceFee = shippingRate ? Math.round((applyShippingServiceFee(rawShipping) - rawShipping) * 100) / 100 : 0;
  const grandTotal = Math.max(0, total + rawShipping + serviceFee - couponDiscount);
  const [showFeeInfo, setShowFeeInfo] = useState(false);

  return (
    <section className="co-panel">
      <h2 className="co-panel-head">Order Summary</h2>
      <div className="co-panel-body">
        <table className="co-totals">
          <tbody>
            <tr>
              <th>Sub-Total:</th>
              <td>${total.toFixed(2)}</td>
            </tr>
            <tr>
              <th>{shippingRate ? `${shippingRate.carrier} – ${shippingRate.service}` : "Shipping"}:</th>
              <td className={rawShipping === 0 && shippingRate ? "co-free" : undefined}>
                {shippingRate ? (rawShipping === 0 ? "FREE" : `$${rawShipping.toFixed(2)}`) : "—"}
              </td>
            </tr>
            {shippingRate && (
              <tr>
                <th>
                  <span className="co-fee">
                    Service Fee
                    <button
                      type="button"
                      onClick={() => setShowFeeInfo((v) => !v)}
                      aria-label="Why am I being charged a service fee?"
                      className="co-fee-btn"
                    >
                      ?
                    </button>
                    {showFeeInfo && (
                      <span className="co-fee-tip">
                        If you select a shipping carrier costing less than $10, an additional service cost of $2 will be added.
                      </span>
                    )}
                  </span>
                </th>
                <td>${serviceFee.toFixed(2)}</td>
              </tr>
            )}
            {couponDiscount > 0 && (
              <tr className="co-discount">
                <th>Coupon Discount:</th>
                <td>−${couponDiscount.toFixed(2)}</td>
              </tr>
            )}
            <tr className="co-grand">
              <th>Total:</th>
              <td>{shippingRate ? `$${grandTotal.toFixed(2)}` : `$${total.toFixed(2)}`}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Classic styles ───────────────────────────────────────────────────────────
const CHECKOUT_CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .co { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #6b6b6b; background: #fff; min-height: 60vh; }
  .co *, .co *::before, .co *::after { box-sizing: border-box; }
  .co p { margin: 0; }
  .co-layout {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 12px;
    padding: 6px 24px 40px;
    align-items: start;
  }
  .co-content { min-width: 0; padding-top: 4px; }
  .co-title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .co-title { font-size: 15px; font-weight: bold; color: #4f72a8; margin: 2px 0 2px; }
  .co-sub { color: #8a8a8a; }
  .co-rule { border: 0; border-top: 2px solid #555; margin: 8px 0 12px; }

  /* Step bar */
  .co-steps { display: flex; margin-bottom: 14px; border: 1px solid #a9b3cf; }
  .co-step {
    flex: 1; text-align: center; padding: 5px 6px; font-weight: bold; color: #8a8a8a;
    background: #f4f5f9; border-left: 1px solid #a9b3cf; white-space: nowrap;
  }
  .co-step:first-child { border-left: 0; }
  .co-step.is-done { color: #1d7a1d; background: #eef6ee; }
  .co-step.is-active { color: #fff; background: linear-gradient(to bottom, #164472 0px, #0d3b6c 3px, #2b547e 100%); }

  .co-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; align-items: start; }

  /* Panels */
  .co-panel { border: 1px solid #a9b3cf; border-top-right-radius: 8px; background: #e8ebf3; margin-bottom: 14px; }
  .co-panel-head {
    background: #a9b3cf; color: #fff; font-weight: bold; font-size: 11px;
    padding: 3px 10px; border-top-right-radius: 7px; margin: 0;
  }
  .co-panel-body { padding: 12px 10px; }

  /* Form rows: label | field */
  .co-fields { display: flex; flex-direction: column; gap: 8px; }
  .co-row { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 4px 12px; align-items: start; }
  .co-label { padding-top: 4px; color: #555; letter-spacing: .2px; }
  .co-req { color: #c8102e; }
  .co-hint { color: #8a8a8a; font-size: 10px; }
  .co-ctl { position: relative; max-width: 360px; }
  .co-input {
    width: 100%; height: 22px; padding: 0 22px 0 5px;
    border: 1px solid #333; border-radius: 0; background: #fff;
    font: inherit; font-size: 11px; color: #000;
    -webkit-appearance: none; appearance: none;
  }
  select.co-input {
    padding-right: 22px; cursor: pointer;
    background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0h8L4 5z' fill='%23333'/%3E%3C/svg%3E") no-repeat right 6px center;
  }
  .co-input:focus { outline: 1px solid #1c4874; border-color: #1c4874; }
  .co-input.is-error { border-color: #c8102e; background-color: #fff5f5; }
  .co-input.is-valid { border-color: #1d7a1d; }
  .co-input[readonly] { background: #f4f5f9; color: #333; border-color: #1d7a1d; cursor: default; }
  .co-input::placeholder { color: #b5b5b5; }
  .co-ok { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); color: #1d7a1d; font-weight: bold; pointer-events: none; }
  .co-ctl .co-spinner { position: absolute; right: 5px; top: 5px; }
  .co-field-err { color: #c8102e; margin-top: 2px !important; font-size: 10.5px; }

  .co-phone { display: flex; max-width: 360px; border: 1px solid #333; background: #fff; position: relative; }
  .co-phone.is-error { border-color: #c8102e; }
  .co-phone.is-valid { border-color: #1d7a1d; }
  .co-phone-cc { display: inline-flex; align-items: center; padding: 0 6px; background: #dfe2ea; color: #1c4874; font-weight: bold; border-right: 1px solid #a9b3cf; min-width: 40px; justify-content: center; }
  .co-phone input { flex: 1; min-width: 0; height: 20px; border: 0; padding: 0 22px 0 5px; font: inherit; font-size: 11px; color: #000; outline: none; background: transparent; }

  .co-po { margin-top: 4px; max-width: 360px; border: 1px solid #a9b3cf; background: #fff; }
  .co-po-head { background: #dfe2ea; color: #1c4874; font-weight: bold; padding: 3px 6px; }
  .co-po-list { max-height: 160px; overflow-y: auto; }
  .co-po-item {
    display: flex; justify-content: space-between; gap: 8px; width: 100%; text-align: left;
    padding: 4px 6px; background: #fff; border: 0; border-top: 1px solid #e3e6ee;
    font: inherit; font-size: 11px; color: #555; cursor: pointer;
  }
  .co-po-item:hover { background: #eef2f8; color: #1c4874; }
  .co-po-item strong { color: #333; }
  .co-pin-ok { margin-top: 4px; max-width: 360px; display: flex; align-items: center; gap: 8px; padding: 4px 6px; border: 1px solid #1d7a1d; background: #eef6ee; color: #1d5e1d; flex-wrap: wrap; }

  .co-msg { padding: 5px 8px; border: 1px solid #d9a3a3; background: #fbecec; color: #b00000; }
  .co-linkbtn { background: none; border: 0; padding: 0; font: inherit; font-size: 11px; color: #1c4874; font-weight: bold; text-decoration: underline; cursor: pointer; margin-left: auto; }

  .co-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    min-height: 22px; padding: 3px 14px;
    background: #c6cfe6; border: 1px solid #2b547e; border-radius: 0; color: #1c4874;
    font: inherit; font-size: 11px; font-weight: bold; text-decoration: none; cursor: pointer;
  }
  .co-btn:hover:not(:disabled) { background: #b5c0de; }
  .co-btn.is-red { background: #c8102e; border-color: #8f0a20; color: #fff; }
  .co-btn.is-red:hover:not(:disabled) { background: #a90d27; }
  .co-btn:disabled { background: #e3e6ee; border-color: #b5b5b5; color: #999; cursor: not-allowed; }

  .co-addr { background: #fff; border: 1px solid #c9cfdf; padding: 8px 10px; display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; line-height: 1.6; }
  .co-addr strong { color: #333; }
  .co-addr-head { color: #1c4874; font-weight: bold; margin-bottom: 2px !important; }
  .co-addr-rate { color: #1c4874; font-weight: bold; margin-top: 4px !important; }
  .co-stack { display: flex; flex-direction: column; gap: 12px; }
  .co-paybox { background: #fff; border: 1px solid #c9cfdf; min-height: 56px; display: flex; align-items: center; justify-content: center; }
  .co-secure { text-align: center; color: #8a8a8a; margin-top: 4px; }

  /* Right column */
  .co-trust { list-style: none; margin: 0 0 12px; padding: 6px 10px; border: 1px solid #c9cfdf; background: #fff; }
  .co-trust li { padding-left: 12px; position: relative; line-height: 1.8; color: #1c4874; font-weight: bold; }
  .co-trust li::before { content: "\\00BB"; position: absolute; left: 0; }
  .co-coupon { display: flex; gap: 6px; }
  .co-coupon .co-input { padding-right: 5px; letter-spacing: .08em; }
  .co-coupon-ok { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; padding: 5px 8px; border: 1px solid #1d7a1d; background: #eef6ee; color: #1d5e1d; font-weight: bold; }
  .co-coupon-ok button { background: none; border: 0; padding: 0; font: inherit; font-size: 10.5px; color: #555; text-decoration: underline; cursor: pointer; }
  .co-coupon-msg { margin-top: 4px !important; }

  .co-totals { width: 100%; border-collapse: collapse; background: #fff; }
  .co-totals th, .co-totals td { padding: 5px 8px; border: 1px solid #c9cfdf; }
  .co-totals th { text-align: left; font-weight: normal; color: #555; background: #f4f5f9; }
  .co-totals td { text-align: right; color: #333; font-weight: bold; white-space: nowrap; }
  .co-totals .co-free, .co-totals .co-discount th, .co-totals .co-discount td { color: #1d7a1d; }
  .co-totals tr.co-grand th, .co-totals tr.co-grand td { font-weight: bold; color: #000; font-size: 12px; background: #dfe2ea; }
  .co-fee { position: relative; display: inline-flex; align-items: center; gap: 5px; }
  .co-fee-btn {
    width: 14px; height: 14px; padding: 0; border: 1px solid #2b547e; background: #c6cfe6;
    color: #1c4874; font: inherit; font-size: 9px; font-weight: bold; line-height: 1; cursor: pointer;
  }
  .co-fee-tip {
    position: absolute; top: 18px; left: 0; z-index: 10; width: 220px; padding: 6px 8px;
    background: #fffbe0; border: 1px solid #e0c36a; color: #5c4600; font-size: 10.5px; line-height: 1.5; font-weight: normal;
  }

  .co-expect { list-style: none; margin: 0; padding: 0; background: #fff; border: 1px solid #c9cfdf; }
  .co-expect li { padding: 5px 8px; border-top: 1px solid #e3e6ee; line-height: 1.5; }
  .co-expect li:first-child { border-top: 0; }
  .co-expect b { color: #c8102e; margin-right: 4px; }
  .co-expect strong { color: #1c4874; }

  .co-help { text-align: center; line-height: 1.7; }
  .co-help a { color: #1c4874; font-weight: bold; }

  /* Fixed action bar (keeps the main button always on screen) */
  .co-action-bar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
    background: #dfe2ea; border-top: 2px solid #1c4874;
    font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px;
  }
  .co-action-bar-inner { padding: 8px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .co-bar-label { color: #555; }
  .co-bar-total { font-size: 15px; font-weight: bold; color: #000; }
  .co-action-bar .co-btn { min-height: 28px; font-size: 12px; padding: 4px 18px; }
  .co-bar-spacer { height: 64px; }

  .co-spinner {
    width: 12px; height: 12px; display: inline-block; flex-shrink: 0;
    border: 2px solid rgba(28,72,116,.25); border-top-color: #1c4874; border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  .co-overlay {
    position: fixed; inset: 0; z-index: 9999; background: rgba(255,255,255,.9);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
    padding: 0 20px; text-align: center; font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 11px; color: #6b6b6b;
  }
  .co-overlay .co-spinner { width: 28px; height: 28px; border-width: 3px; }
  .co-overlay strong { font-size: 13px; color: #1c4874; }

  /* Shipping rate list: classic look via its CSS variables */
  .co .ss-scope {
    --ss-paper: #ffffff; --ss-surface: #ffffff; --ss-ink: #333333; --ss-ink-soft: #6b6b6b;
    --ss-line: #c9cfdf; --ss-blue: #1c4874; --ss-blue-soft: #e8ebf3;
    --ss-display: Verdana, Arial, Helvetica, sans-serif; --ss-mono: Verdana, Arial, Helvetica, sans-serif;
    font-family: Verdana, Arial, Helvetica, sans-serif;
  }
  .co .ss-frame { padding: 0; border-radius: 0; background: none; border: 1px solid #a9b3cf; }
  .co .ss-card { border-radius: 0; }
  .co .ss-scope [class*="rounded"] { border-radius: 0 !important; }

  @media (max-width: 1150px) {
    .co-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 900px) {
    .co-layout { grid-template-columns: 1fr; padding: 8px 14px 32px; }
    .co-content { order: 1; }
    .co-layout > aside { order: 2; }
    .co-action-bar-inner { padding: 8px 14px; }
  }
  @media (max-width: 560px) {
    .co-row { grid-template-columns: 1fr; }
    .co-label { padding-top: 0; }
    .co-ctl, .co-phone, .co-po, .co-pin-ok { max-width: none; }
    .co-input { height: 32px; font-size: 14px; }
    .co-phone input { height: 30px; font-size: 14px; }
    .co-steps { font-size: 10px; }
    .co-action-bar-inner { flex-wrap: wrap; }
    .co-action-bar .co-btn { width: 100%; }
    .co-bar-spacer { height: 100px; }
  }
`;

// ─── Step type ─────────────────────────────────────────────────────────────────
type Step = "shipping" | "rates" | "payment";

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CheckoutPage({
  navCategories = [],
}: {
  // Display-only: category tree for the classic left sidebar.
  navCategories?: NavCategory[];
}) {
  const { apiFetch } = useApi();
  const router = useRouter();
  const [step, setStep] = useState<Step>("shipping");
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ShippingForm, boolean>>
  >({});
  const [orderId, setOrderId] = useState<string | null>(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(
    null,
  );

  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [postOffices, setPostOffices] = useState<
    { Name: string; District: string; State: string }[]
  >([]);
  const [pinVerified, setPinVerified] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [cartEmpty, setCartEmpty] = useState(false);

  useEffect(() => {
    apiFetch("/api/cart")
      .then((d) => {
        setTotal(d.data.totals?.total || 0);
        const items = d.data.cart?.items || [];
        if (items.length === 0) {
          setCartEmpty(true);
          router.push("/cart");
        }
      })
      .catch(() => router.push("/login"));
  }, [apiFetch, router]); // both stable — still runs once on mount

  // Bring the top of the card into view whenever the step changes, so the
  // person always starts a new step (address / rates / payment) from the top
  // instead of landing wherever their scroll position happened to be.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    const newErrors = validateForm(form, pinVerified);
    setErrors((prev) => {
      const updated: FormErrors = { ...prev };
      (Object.keys(newErrors) as (keyof ShippingForm)[]).forEach((k) => {
        if (touched[k]) updated[k] = newErrors[k];
      });
      (Object.keys(touched) as (keyof ShippingForm)[]).forEach((k) => {
        if (!newErrors[k]) delete updated[k];
      });
      return updated;
    });
  }, [form, touched, pinVerified]);

  const handleCountryChange = (country: string) => {
    setForm((f) => ({ ...f, country, state: "", postalCode: "", city: "" }));
    setTouched((t) => ({ ...t, country: true }));
    setPostOffices([]);
    setPinError("");
    setPinVerified(false);
  };

  const handleBlur = (field: keyof ShippingForm) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const newErrors = validateForm(form, pinVerified);
    setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
  };

  const handleChange = (field: keyof ShippingForm, value: string) => {
    let processed = value;
    if (field === "fullName")
      processed = value.replace(/[^A-Za-z\u00C0-\u024F\s'\-\.]/g, "");
    setForm((f) => ({ ...f, [field]: processed }));
  };

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 15);
    setForm((f) => ({ ...f, phone: digits }));
  };

  const handlePincodeChange = async (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, postalCode: digits, city: "", state: "" }));
    setPostOffices([]);
    setPinError("");
    setPinVerified(false);
    if (digits.length === 6) {
      setPinLoading(true);
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${digits}`,
        );
        const data = await res.json();
        if (data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
          const offices = data[0].PostOffice as {
            Name: string;
            District: string;
            State: string;
          }[];
          if (offices.length === 1) {
            setForm((f) => ({
              ...f,
              postalCode: digits,
              city: offices[0].District,
              state: offices[0].State,
              country: "IN",
            }));
            setTouched((t) => ({
              ...t,
              postalCode: true,
              city: true,
              state: true,
            }));
            setPinVerified(true);
            setErrors((prev) => {
              const updated = { ...prev };
              delete updated.city;
              delete updated.state;
              delete updated.postalCode;
              return updated;
            });
          } else {
            setPostOffices(offices);
          }
        } else {
          setPinError("Invalid pincode. Please check and try again.");
        }
      } catch {
        setPinError("Could not verify pincode. Fill city and state manually.");
      } finally {
        setPinLoading(false);
      }
    }
  };

  const handlePostOfficeSelect = (po: {
    Name: string;
    District: string;
    State: string;
  }) => {
    setForm((f) => ({
      ...f,
      city: po.District,
      state: po.State,
      country: "IN",
    }));
    setTouched((t) => ({ ...t, city: true, state: true, postalCode: true }));
    setPostOffices([]);
    setPinVerified(true);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.city;
      delete updated.state;
      delete updated.postalCode;
      return updated;
    });
  };

  const handlePostalChange = (value: string) => {
    if (form.country === "IN") {
      handlePincodeChange(value);
      return;
    }
    let processed = value;
    if (form.country === "US") {
      const d = value.replace(/\D/g, "").slice(0, 9);
      processed = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
    } else if (form.country === "CA") {
      const clean = value
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 6);
      processed =
        clean.length > 3 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean;
    } else {
      processed = value.toUpperCase().slice(0, 10);
    }
    setForm((f) => ({ ...f, postalCode: processed }));
  };

  // ─── Step 1: validate address form → go to rate selection ─────────────────
  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.keys(EMPTY_FORM).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<keyof ShippingForm, boolean>,
    );
    setTouched(allTouched);
    if (form.country === "IN" && !pinVerified && postOffices.length === 0) {
      setPinError(
        "Please enter a valid 6-digit pincode to auto-fill your location.",
      );
      return;
    }
    const newErrors = validateForm(form, pinVerified);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setStep("rates");
  };

  // ─── Step 2: rate selected → create order → go to payment ─────────────────
  const handleRateConfirm = async () => {
    if (!selectedShipping) return;
    setApiError("");
    setLoading(true);
    try {
      // If we already created an order (the customer went Back from the
      // payment step to pick a different rate), cancel that one first —
      // otherwise every re-confirm leaves a duplicate 'pending' order behind
      // that's still holding stock it'll never actually pay for.
      if (orderId) {
        await apiFetch(`/api/orders/${orderId}`, { method: "DELETE" }).catch(() => {});
      }

      const data = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: form,
          paymentMethod: "paypal",
          shippingCarrier: selectedShipping.carrier,
          shippingService: selectedShipping.service,
          shippingServiceCode: selectedShipping.serviceCode ?? null,
          shippingRate: selectedShipping.rate,
          shippingRateId: selectedShipping.rateId,
          shippingEstimatedDays: selectedShipping.estimatedDays ?? null,
          shippingEstimatedDelivery: selectedShipping.estimatedDelivery ?? null,
          ...(couponCode ? { couponCode } : {}),
        }),
      });
      // ── Set orderId first, then step — both are batched by React 18
      // but the PayPal block guards on orderId so it won't render until truthy
      setOrderId(data.data._id);
      setStep("payment");
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Failed to create order",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: PayPal handlers ───────────────────────────────────────────────
  const createPayPalOrder = async () => {
    const data = await apiFetch("/api/payment/paypal/create", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
    return data.data.paypalOrderId;
  };

  const onPayPalApprove = async (data: { orderID: string }) => {
    setPaymentProcessing(true);
    try {
      await apiFetch("/api/payment/paypal/capture", {
        method: "POST",
        body: JSON.stringify({ paypalOrderId: data.orderID }),
      });
      cartEvents.refresh();
      router.push("/orders?success=true");
    } catch (err) {
      setPaymentProcessing(false);
      setApiError(
        err instanceof Error ? err.message : "Payment capture failed",
      );
    }
  };

  // ─── Destination address for ShippingRateSelector ─────────────────────────
  const shippingDestination = {
    fullName: form.fullName,
    street1: form.addressLine1,
    street2: form.addressLine2 || undefined,
    city: form.city,
    state: form.state,
    postalCode: form.postalCode,
    country: form.country,
    phone: form.phone,
  };

  const isIndia = form.country === "IN";
  const showUSCADropdown = form.country === "US" || form.country === "CA";
  const stateOptions = form.country === "US" ? US_STATES : CA_PROVINCES;
  const stateLabel = form.country === "CA" ? "Province" : "State";

  // ─── Style helpers ─────────────────────────────────────────────────────────
  const fieldState = (
    field: keyof ShippingForm,
  ): "error" | "valid" | "idle" => {
    if (errors[field]) return "error";
    if (touched[field] && !errors[field] && form[field]) return "valid";
    return "idle";
  };
  const inputCls = (state: "error" | "valid" | "idle") => `co-input is-${state}`;

  const STEPS: Step[] = ["shipping", "rates", "payment"];
  const STEP_LABELS: Record<Step, string> = {
    shipping: "Address",
    rates: "Shipping",
    payment: "Payment",
  };

  // ─── PayPalScriptProvider options (stable — never recreated) ───────────────
  // IMPORTANT: defined outside JSX so the object reference doesn't change on
  // re-render, which would cause the SDK to reload and break the buttons.
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
  };

  // Whether the fixed bottom action bar should be shown for the current step.
  // This keeps the primary call-to-action (choose shipping / continue to
  // payment) permanently visible on screen, so people never have to scroll
  // down to find it after picking a shipping rate.
  const showActionBar = step === "shipping" || step === "rates";
  const grandTotalForBar = Math.max(
    0,
    total +
      (selectedShipping ? applyShippingServiceFee(selectedShipping.rate) : 0) -
      couponDiscount,
  );

  if (cartEmpty) return null;

  return (
    // ── PayPalScriptProvider wraps the ENTIRE page so it is never
    // unmounted/remounted as the user moves between steps.
    // PayPalButtons inside step 3 will work because the SDK is already loaded.
    <PayPalScriptProvider options={paypalOptions}>
      <>
        <style>{CHECKOUT_CSS}</style>

        {/* ── Payment Processing Overlay ────────────────────────────────────── */}
        {paymentProcessing && (
          <div className="co-overlay" role="status">
            <span className="co-spinner" />
            <strong>Confirming your payment…</strong>
            <p style={{ maxWidth: 280, margin: 0 }}>
              Please wait while we verify your transaction and prepare your
              order.
            </p>
          </div>
        )}

        <div className="co">
          <div className="co-layout">
            <ClassicSidebar categories={navCategories} />

            <div className="co-content">
              <div className="co-title-row">
                <h1 className="co-title">
                  {step === "shipping"
                    ? "Delivery Details"
                    : step === "rates"
                      ? "Choose Shipping"
                      : "Complete Payment"}
                </h1>
                <span className="co-sub">
                  {step === "shipping"
                    ? "Enter your shipping address to continue"
                    : step === "rates"
                      ? "Select a shipping method for your order"
                      : "Review your order and complete payment securely"}
                </span>
              </div>
              <hr className="co-rule" />

              {/* Step indicator */}
              <div className="co-steps">
                {STEPS.map((s, i) => {
                  const done = STEPS.indexOf(step) > i;
                  const active = step === s;
                  return (
                    <div
                      key={s}
                      className={`co-step${active ? " is-active" : done ? " is-done" : ""}`}
                    >
                      {done ? "✓" : `${i + 1}.`} {STEP_LABELS[s]}
                    </div>
                  );
                })}
              </div>

              <div className="co-grid">
                {/* LEFT COLUMN */}
                <div>
                  <section className="co-panel">
                    <h2 className="co-panel-head">
                      {step === "shipping"
                        ? "Delivery Address"
                        : step === "rates"
                          ? "Shipping Method"
                          : "Payment Information"}
                    </h2>
                    <div className="co-panel-body">
                      {/* ── STEP 1: SHIPPING ADDRESS ── */}
                      {step === "shipping" && (
                        <form
                          id="shipping-form"
                          onSubmit={handleShippingSubmit}
                          noValidate
                        >
                          <div className="co-fields">
                            {/* Full Name */}
                            <div className="co-row">
                              <label className="co-label" htmlFor="co-fullName">
                                Full Name: <span className="co-req">*</span>
                              </label>
                              <div>
                                <div className="co-ctl">
                                  <input
                                    id="co-fullName"
                                    className={inputCls(fieldState("fullName"))}
                                    placeholder="Rahul Sharma"
                                    value={form.fullName}
                                    onChange={(e) =>
                                      handleChange("fullName", e.target.value)
                                    }
                                    onBlur={() => handleBlur("fullName")}
                                    autoComplete="name"
                                  />
                                  {fieldState("fullName") === "valid" && <CheckMark />}
                                </div>
                                <FieldError msg={errors.fullName} />
                              </div>
                            </div>

                            {/* Country */}
                            <div className="co-row">
                              <label className="co-label" htmlFor="co-country">
                                Country: <span className="co-req">*</span>
                              </label>
                              <div>
                                <div className="co-ctl">
                                  <select
                                    id="co-country"
                                    className={inputCls(fieldState("country"))}
                                    value={form.country}
                                    onChange={(e) =>
                                      handleCountryChange(e.target.value)
                                    }
                                    onBlur={() => handleBlur("country")}
                                  >
                                    <option value="">Select country…</option>
                                    {COUNTRIES.map((c) => (
                                      <option key={c.code} value={c.code}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <FieldError msg={errors.country} />
                              </div>
                            </div>

                            {/* India pincode */}
                            {isIndia && (
                              <div className="co-row">
                                <label className="co-label" htmlFor="co-pincode">
                                  Pincode: <span className="co-req">*</span>
                                  <br />
                                  <span className="co-hint">(auto-fills city &amp; state)</span>
                                </label>
                                <div>
                                  <div className="co-ctl">
                                    <input
                                      id="co-pincode"
                                      className={
                                        pinError
                                          ? inputCls("error")
                                          : pinVerified
                                            ? inputCls("valid")
                                            : inputCls(fieldState("postalCode"))
                                      }
                                      placeholder="Enter 6-digit pincode"
                                      value={form.postalCode}
                                      onChange={(e) =>
                                        handlePincodeChange(e.target.value)
                                      }
                                      onBlur={() => handleBlur("postalCode")}
                                      autoComplete="postal-code"
                                      maxLength={6}
                                      inputMode="numeric"
                                    />
                                    {pinLoading && <Spinner />}
                                    {pinVerified && !pinLoading && <CheckMark />}
                                  </div>
                                  {pinError && <p className="co-field-err">{pinError}</p>}
                                  <FieldError msg={errors.postalCode} />
                                  <PincodeBanner
                                    postOffices={postOffices}
                                    onSelect={handlePostOfficeSelect}
                                  />
                                  {pinVerified && form.city && form.state && (
                                    <div className="co-pin-ok">
                                      <span>
                                        {form.city}, {form.state}, India
                                      </span>
                                      <button
                                        type="button"
                                        className="co-linkbtn"
                                        onClick={() => {
                                          setForm((f) => ({
                                            ...f,
                                            postalCode: "",
                                            city: "",
                                            state: "",
                                          }));
                                          setPinVerified(false);
                                          setPostOffices([]);
                                          setPinError("");
                                          setErrors((prev) => {
                                            const u = { ...prev };
                                            delete u.city;
                                            delete u.state;
                                            return u;
                                          });
                                        }}
                                      >
                                        Change
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Address Line 1 */}
                            <div className="co-row">
                              <label className="co-label" htmlFor="co-address1">
                                Street Address: <span className="co-req">*</span>
                              </label>
                              <div>
                                <div className="co-ctl">
                                  <input
                                    id="co-address1"
                                    className={inputCls(fieldState("addressLine1"))}
                                    placeholder={
                                      isIndia
                                        ? "House No., Street, Area"
                                        : "123 Main Street"
                                    }
                                    value={form.addressLine1}
                                    onChange={(e) =>
                                      handleChange("addressLine1", e.target.value)
                                    }
                                    onBlur={() => handleBlur("addressLine1")}
                                    autoComplete="address-line1"
                                  />
                                  {fieldState("addressLine1") === "valid" && <CheckMark />}
                                </div>
                                <FieldError msg={errors.addressLine1} />
                              </div>
                            </div>

                            {/* Address Line 2 */}
                            <div className="co-row">
                              <label className="co-label" htmlFor="co-address2">
                                Apt / Suite / Unit:{" "}
                                <span className="co-hint">(optional)</span>
                              </label>
                              <div className="co-ctl">
                                <input
                                  id="co-address2"
                                  className={inputCls("idle")}
                                  placeholder={
                                    isIndia
                                      ? "Landmark, Colony, etc."
                                      : "Apt 4B, Floor 2, etc."
                                  }
                                  value={form.addressLine2}
                                  onChange={(e) =>
                                    setForm((f) => ({
                                      ...f,
                                      addressLine2: e.target.value,
                                    }))
                                  }
                                  autoComplete="address-line2"
                                />
                              </div>
                            </div>

                            {/* City */}
                            <div className="co-row">
                              <label className="co-label" htmlFor="co-city">
                                {isIndia ? "District / City" : LABELS.city}:{" "}
                                <span className="co-req">*</span>
                              </label>
                              <div>
                                <div className="co-ctl">
                                  <input
                                    id="co-city"
                                    className={
                                      isIndia && pinVerified
                                        ? "co-input"
                                        : inputCls(fieldState("city"))
                                    }
                                    placeholder={
                                      isIndia ? "Auto-filled" : "New York"
                                    }
                                    value={form.city}
                                    onChange={(e) =>
                                      !pinVerified &&
                                      handleChange("city", e.target.value)
                                    }
                                    onBlur={() =>
                                      !pinVerified && handleBlur("city")
                                    }
                                    readOnly={isIndia && pinVerified}
                                    autoComplete="address-level2"
                                  />
                                  {((isIndia && pinVerified) ||
                                    (!isIndia &&
                                      fieldState("city") === "valid")) && <CheckMark />}
                                </div>
                                <FieldError msg={errors.city} />
                              </div>
                            </div>

                            {/* State */}
                            <div className="co-row">
                              <label className="co-label" htmlFor="co-state">
                                {isIndia
                                  ? "State"
                                  : showUSCADropdown
                                    ? stateLabel
                                    : "State / Region"}
                                : <span className="co-req">*</span>
                              </label>
                              <div>
                                {isIndia ? (
                                  <div className="co-ctl">
                                    {pinVerified ? (
                                      <input
                                        id="co-state"
                                        className="co-input"
                                        value={form.state}
                                        readOnly
                                      />
                                    ) : (
                                      <select
                                        id="co-state"
                                        className={inputCls(fieldState("state"))}
                                        value={form.state}
                                        onChange={(e) => {
                                          setForm((f) => ({
                                            ...f,
                                            state: e.target.value,
                                          }));
                                          setTouched((t) => ({
                                            ...t,
                                            state: true,
                                          }));
                                        }}
                                        onBlur={() => handleBlur("state")}
                                      >
                                        <option value="">Select state…</option>
                                        {IN_STATES.map((s) => (
                                          <option key={s} value={s}>
                                            {s}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    {pinVerified && <CheckMark />}
                                  </div>
                                ) : showUSCADropdown ? (
                                  <div className="co-ctl">
                                    <select
                                      id="co-state"
                                      className={inputCls(fieldState("state"))}
                                      value={form.state}
                                      onChange={(e) => {
                                        setForm((f) => ({
                                          ...f,
                                          state: e.target.value,
                                        }));
                                        setTouched((t) => ({ ...t, state: true }));
                                      }}
                                      onBlur={() => handleBlur("state")}
                                    >
                                      <option value="">Select…</option>
                                      {stateOptions.map(([code, name]) => (
                                        <option key={code} value={code}>
                                          {name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="co-ctl">
                                    <input
                                      id="co-state"
                                      className={inputCls(fieldState("state"))}
                                      placeholder="State / Region"
                                      value={form.state}
                                      onChange={(e) =>
                                        setForm((f) => ({
                                          ...f,
                                          state: e.target.value,
                                        }))
                                      }
                                      onBlur={() => handleBlur("state")}
                                      autoComplete="address-level1"
                                    />
                                  </div>
                                )}
                                <FieldError msg={errors.state} />
                              </div>
                            </div>

                            {/* Postal code non-India */}
                            {!isIndia && (
                              <div className="co-row">
                                <label className="co-label" htmlFor="co-postal">
                                  Postal Code: <span className="co-req">*</span>
                                  {POSTAL_PATTERNS[form.country] && (
                                    <>
                                      <br />
                                      <span className="co-hint">
                                        ({POSTAL_PATTERNS[form.country].hint})
                                      </span>
                                    </>
                                  )}
                                </label>
                                <div>
                                  <div className="co-ctl">
                                    <input
                                      id="co-postal"
                                      className={inputCls(fieldState("postalCode"))}
                                      placeholder={
                                        POSTAL_PATTERNS[form.country]?.hint ||
                                        "Postal code"
                                      }
                                      value={form.postalCode}
                                      onChange={(e) =>
                                        handlePostalChange(e.target.value)
                                      }
                                      onBlur={() => handleBlur("postalCode")}
                                      autoComplete="postal-code"
                                    />
                                    {fieldState("postalCode") === "valid" && <CheckMark />}
                                  </div>
                                  <FieldError msg={errors.postalCode} />
                                </div>
                              </div>
                            )}

                            {/* Phone */}
                            <div className="co-row">
                              <label className="co-label" htmlFor="co-phone">
                                Phone Number: <span className="co-req">*</span>
                              </label>
                              <div>
                                <div
                                  className={`co-phone${
                                    errors.phone
                                      ? " is-error"
                                      : touched.phone && !errors.phone && form.phone
                                        ? " is-valid"
                                        : ""
                                  }`}
                                >
                                  <span className="co-phone-cc">
                                    {form.country === "IN"
                                      ? "+91"
                                      : form.country === "US" || form.country === "CA"
                                        ? "+1"
                                        : form.country === "GB"
                                          ? "+44"
                                          : form.country === "AU"
                                            ? "+61"
                                            : form.country === "AE"
                                              ? "+971"
                                              : "+"}
                                  </span>
                                  <input
                                    id="co-phone"
                                    type="tel"
                                    placeholder={
                                      isIndia ? "98765 43210" : "(555) 123-4567"
                                    }
                                    value={
                                      form.phone
                                        ? formatPhone(form.phone, form.country)
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handlePhoneChange(e.target.value)
                                    }
                                    onBlur={() => handleBlur("phone")}
                                    autoComplete="tel"
                                    inputMode="numeric"
                                  />
                                  {touched.phone && !errors.phone && form.phone && <CheckMark />}
                                </div>
                                <FieldError msg={errors.phone} />
                              </div>
                            </div>

                            {Object.keys(errors).length > 0 &&
                              Object.keys(touched).length > 3 && (
                                <div className="co-msg">
                                  Please fix {Object.keys(errors).length} error
                                  {Object.keys(errors).length > 1 ? "s" : ""} before
                                  continuing
                                </div>
                              )}
                          </div>
                        </form>
                      )}

                      {/* ── STEP 2: SHIPPING RATE SELECTOR ── */}
                      {step === "rates" && (
                        <div className="co-stack">
                          {/* Address summary */}
                          <div className="co-addr">
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p className="co-addr-head">Ship to:</p>
                              <p>
                                <strong>{form.fullName}</strong>
                              </p>
                              <p>
                                {form.addressLine1}, {form.city}, {form.state}{" "}
                                {form.postalCode}
                              </p>
                            </div>
                            <button
                              className="co-linkbtn"
                              onClick={() => setStep("shipping")}
                            >
                              Edit
                            </button>
                          </div>

                          <ShippingRateSelector
                            origin={STORE_ORIGIN}
                            destination={shippingDestination}
                            package={DEFAULT_PACKAGE}
                            onSelect={setSelectedShipping}
                            selectedServiceCode={
                              selectedShipping
                                ? `${selectedShipping.carrier}-${selectedShipping.service}`
                                : undefined
                            }
                          />

                          {apiError && <div className="co-msg">{apiError}</div>}

                          <div>
                            <button
                              className="co-btn"
                              onClick={() => setStep("shipping")}
                            >
                              « Back to Address
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── STEP 3: PAYMENT ── */}
                      {step === "payment" && (
                        <div className="co-stack">
                          {/* Shipping summary */}
                          <div className="co-addr">
                            <div style={{ minWidth: 0 }}>
                              <p className="co-addr-head">Delivering to:</p>
                              <p>
                                <strong>{form.fullName}</strong>
                              </p>
                              <p>
                                {form.addressLine1}
                                {form.addressLine2 ? `, ${form.addressLine2}` : ""}
                                <br />
                                {form.city}, {form.state} {form.postalCode}
                                <br />
                                {COUNTRIES.find((c) => c.code === form.country)?.name}
                              </p>
                              {selectedShipping && (
                                <p className="co-addr-rate">
                                  {selectedShipping.carrier} |{" "}
                                  {selectedShipping.service} — $
                                  {applyShippingServiceFee(
                                    selectedShipping.rate,
                                  ).toFixed(2)}
                                  {selectedShipping.estimatedDelivery &&
                                    ` | ${selectedShipping.estimatedDelivery}`}
                                </p>
                              )}
                            </div>
                          </div>

                          {apiError && <div className="co-msg">{apiError}</div>}

                          {/* ── PayPal buttons ────────────────────────────────────────────────────
                              PayPalScriptProvider lives at the top of the tree so it's never
                              remounted. Here we just render the buttons once orderId is ready.
                              While orderId is still null (the brief moment between setOrderId
                              and the re-render), we show a spinner instead.            ── */}
                          <div className="co-paybox">
                            {!orderId ? (
                              <div style={{ padding: 24 }}>
                                <Spinner />
                              </div>
                            ) : (
                              <div style={{ width: "100%", padding: "8px" }}>
                                <PayPalButtons
                                  createOrder={createPayPalOrder}
                                  onApprove={onPayPalApprove}
                                  onError={(err) => setApiError(String(err))}
                                  style={{
                                    layout: "vertical",
                                    color: "blue",
                                    shape: "rect",
                                    label: "pay",
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <button
                              className="co-btn"
                              onClick={() => setStep("rates")}
                            >
                              « Back to Shipping
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <p className="co-secure">
                    🔒 256-bit SSL encrypted | Your information is always secure
                  </p>
                </div>

                {/* RIGHT COLUMN */}
                <div>
                  <TrustBadges />

                  {/* ── Coupon Input ────────────────────────────────────────── */}
                  <section className="co-panel">
                    <h2 className="co-panel-head">Coupon Code</h2>
                    <div className="co-panel-body">
                      {couponDiscount > 0 ? (
                        <div className="co-coupon-ok">
                          <span>
                            ✓ {couponCode} — ${couponDiscount.toFixed(2)} off applied!
                          </span>
                          <button
                            onClick={() => {
                              setCouponCode("");
                              setCouponInput("");
                              setCouponDiscount(0);
                              setCouponMsg("");
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="co-coupon">
                            <input
                              type="text"
                              className="co-input"
                              value={couponInput}
                              onChange={(e) => {
                                setCouponInput(e.target.value.toUpperCase());
                                setCouponMsg("");
                              }}
                              placeholder="Enter code"
                              aria-label="Coupon code"
                            />
                            <button
                              className="co-btn"
                              disabled={couponLoading || !couponInput.trim()}
                              onClick={async () => {
                                if (!couponInput.trim()) return;
                                setCouponLoading(true);
                                setCouponMsg("");
                                try {
                                  const res = await fetch("/api/coupons/validate", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      code: couponInput.trim(),
                                      subtotal: total,
                                    }),
                                  });
                                  const json = await res.json();
                                  if (json?.data?.valid) {
                                    setCouponCode(couponInput.trim().toUpperCase());
                                    setCouponDiscount(json.data.discount);
                                    setCouponMsg("");
                                  } else {
                                    setCouponMsg(
                                      json?.data?.message ??
                                        json?.message ??
                                        "Invalid code.",
                                    );
                                  }
                                } catch {
                                  setCouponMsg("Network error. Try again.");
                                } finally {
                                  setCouponLoading(false);
                                }
                              }}
                            >
                              {couponLoading ? "…" : "Apply"}
                            </button>
                          </div>
                          {couponMsg && (
                            <p
                              className="co-coupon-msg"
                              style={{
                                color: couponMsg.includes("off")
                                  ? "#1d7a1d"
                                  : "#c8102e",
                              }}
                            >
                              {couponMsg}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </section>

                  <OrderSummary
                    total={total}
                    shippingRate={selectedShipping}
                    couponDiscount={couponDiscount}
                  />

                  <section className="co-panel">
                    <h2 className="co-panel-head">What to expect</h2>
                    <div className="co-panel-body">
                      <ol className="co-expect">
                        {[
                          {
                            step: "1",
                            title: "Order Confirmed",
                            desc: "Instant email confirmation",
                          },
                          {
                            step: "2",
                            title: "Packed & Dispatched",
                            desc: "Within 1–2 business days",
                          },
                          {
                            step: "3",
                            title: "Out for Delivery",
                            desc: "3–7 days estimated delivery",
                          },
                        ].map((item) => (
                          <li key={item.step}>
                            <b>{item.step}.</b>
                            <strong>{item.title}</strong> — {item.desc}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </section>

                  <section className="co-panel">
                    <h2 className="co-panel-head">Need help?</h2>
                    <div className="co-panel-body co-help">
                      <p>Our support team is available 24/7</p>
                      <a href="mailto:support@alphaimports.com">
                        support@alphaimports.com
                      </a>
                    </div>
                  </section>
                </div>
              </div>

              {/* Reserve space so the fixed action bar never overlaps content */}
              {showActionBar && (
                <div className="co-bar-spacer" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>

        {/* ── Sticky bottom action bar ──────────────────────────────────────
            Always visible (independent of scroll position) during the
            shipping and rates steps, so the primary CTA is never something
            the person has to hunt for after selecting a carrier. */}
        {showActionBar && (
          <div className="co-action-bar">
            <div className="co-action-bar-inner">
              <div style={{ minWidth: 0 }}>
                <div className="co-bar-label">
                  {step === "rates" && selectedShipping
                    ? `${selectedShipping.carrier} | ${selectedShipping.service}`
                    : step === "rates"
                      ? "Select a shipping method"
                      : "Order total"}
                </div>
                <div className="co-bar-total">
                  {step === "rates"
                    ? `$${grandTotalForBar.toFixed(2)}`
                    : `$${total.toFixed(2)}`}
                </div>
              </div>

              {step === "shipping" ? (
                <button
                  type="submit"
                  form="shipping-form"
                  disabled={loading || pinLoading}
                  className="co-btn is-red"
                >
                  {loading ? (
                    <>
                      <Spinner /> Processing…
                    </>
                  ) : (
                    <>Choose Shipping Method »</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleRateConfirm}
                  disabled={!selectedShipping || loading}
                  className="co-btn is-red"
                >
                  {loading ? (
                    <>
                      <Spinner /> Creating order…
                    </>
                  ) : (
                    <>Continue to Payment »</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </>
    </PayPalScriptProvider>
  );
}