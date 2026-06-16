import { format } from 'date-fns';
import type { Quotation, QuotationItem } from '@/types/domain';

const COMPANY_INFO_LINES = [
  'Office no. L-27, City Square, Khadim Ali Road, Sialkot',
  'Head Office: 2nd Floor, Zaki Arcade, Bahria Town Phase-VII,',
  'Rawalpindi, Pakistan',
  'Mobile: 03404345387  |  Tel: 03008787951',
  'Email: sunpulsesialkot@gmail.com',
  'www.sunpulse.org  |  Fax: 03360400108',
];

const TERMS = [
  'The quotation remains valid for a period of 2 days from the date of issuance.',
  'Payment terms: 50% advance, 20% upon delivery, 20% upon installation completion, and 10% upon meter installation.',
  'Estimated installation time: 10–15 working days (residential) & 25 working days (industrial).',
  'Net metering setup: ~25 working days (residential) and ~45 working days (industrial/commercial).',
  'Installation of 3-phase wire from pole to meter is the responsibility of the client.',
  'The company holds no liability for changes in government policies.',
  'Failure to pay the full amount upon project completion results in withholding of all after-sales and warranty services.',
  '3-Phase connection inside the site (nearest point to inverter) is upon the client.',
  'UPS wiring is upon the client for Hybrid systems (where absent on-site).',
  'All leftover material remains the property of the company.',
  "Civil work (concrete blocks) is upon the client's end unless explicitly mentioned.",
];

function formatPKR(val: number) {
  return `Rs. ${val.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(val: number) {
  return val % 1 === 0 ? String(val) : val.toFixed(2);
}

interface Props {
  quote: Quotation;
  items: QuotationItem[];
}

// Rendered off-screen and captured by html2canvas — all styles are inline.
export function QuotePDFTemplate({ quote, items }: Props) {
  const addressLines = quote.customerAddress.split('\n').filter(Boolean);

  return (
    <div
      style={{
        width: '794px',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#1f2937',
        boxSizing: 'border-box',
        lineHeight: 1,
      }}
    >
      {/* ── Header band ── */}
      <div
        style={{
          backgroundColor: '#14532d',
          padding: '20px 44px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: '0 0 4px',
              letterSpacing: '1px',
            }}
          >
            Sun Pulse Sialkot
          </p>
          {COMPANY_INFO_LINES.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: '10.5px',
                color: '#bbf7d0',
                margin: '0',
                lineHeight: '1.75',
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Logo badge */}
        <div
          style={{
            width: '86px',
            height: '86px',
            borderRadius: '50%',
            border: '3px solid #4ade80',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#166534',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: '#86efac',
              fontWeight: 'bold',
              fontSize: '13px',
              lineHeight: '1.4',
              letterSpacing: '2px',
            }}
          >
            SUN
          </span>
          <span
            style={{
              color: '#86efac',
              fontWeight: 'bold',
              fontSize: '13px',
              lineHeight: '1.4',
              letterSpacing: '2px',
            }}
          >
            PULSE
          </span>
          <span
            style={{
              color: '#4ade80',
              fontSize: '7px',
              marginTop: '4px',
              letterSpacing: '2px',
            }}
          >
            INNOVATION
          </span>
        </div>
      </div>

      {/* ── ESTIMATE banner ── */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          borderBottom: '3px solid #16a34a',
          padding: '10px 44px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#15803d',
            letterSpacing: '5px',
          }}
        >
          ESTIMATE
        </span>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'baseline',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Est No:</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#15803d' }}>
              {quote.estId}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Date:</span>
            <span style={{ fontSize: '12px', color: '#374151', fontWeight: '600' }}>
              {format(new Date(quote.quoteDate), 'dd MMM, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '24px 44px 40px' }}>

        {/* ── Bill To ── */}
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            borderLeft: '4px solid #16a34a',
            borderRadius: '0 6px 6px 0',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#6b7280',
              margin: '0 0 8px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}
          >
            Bill To
          </p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px', color: '#111827' }}>
            {quote.customerName}
          </p>
          {addressLines.map((line, i) => (
            <p key={i} style={{ fontSize: '12px', margin: '0 0 2px', color: '#374151' }}>
              {line}
            </p>
          ))}
        </div>

        {/* ── Items table ── */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '24px',
            fontSize: '12px',
          }}
        >
          <thead>
            <tr>
              {(['Sl.', 'Description', 'Qty', 'Rate', 'Amount'] as const).map((header, i) => (
                <th
                  key={header}
                  style={{
                    backgroundColor: '#1e3a2f',
                    color: '#d1fae5',
                    padding: '10px 12px',
                    textAlign: (i === 0 || i === 1 ? 'left' : i === 2 ? 'center' : 'right') as React.CSSProperties['textAlign'],
                    fontWeight: 'bold',
                    fontSize: '12px',
                    width: ['6%', '48%', '10%', '18%', '18%'][i],
                    borderBottom: '2px solid #16a34a',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? '#f0fdf4' : '#ffffff' }}
              >
                <td
                  style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    verticalAlign: 'top',
                    color: '#6b7280',
                    fontSize: '11px',
                  }}
                >
                  {item.slNo}
                </td>
                <td
                  style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    lineHeight: '1.6',
                    color: '#1f2937',
                  }}
                >
                  {item.description}
                </td>
                <td
                  style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    verticalAlign: 'top',
                    color: '#374151',
                  }}
                >
                  {formatQty(item.quantity)}
                </td>
                <td
                  style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'right',
                    verticalAlign: 'top',
                    color: '#374151',
                  }}
                >
                  {formatPKR(item.unitPrice)}
                </td>
                <td
                  style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'right',
                    verticalAlign: 'top',
                    fontWeight: '600',
                    color: '#111827',
                  }}
                >
                  {formatPKR(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Payment instructions + Totals ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '32px',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#15803d',
                margin: '0 0 10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Payment Instructions
            </p>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 3px' }}>Pay Check to</p>
            <p style={{ fontSize: '11.5px', color: '#1f2937', margin: '0 0 2px', fontWeight: '600' }}>
              Askari Bank, Raja Arcade, Spring North Bahria
            </p>
            <p style={{ fontSize: '11.5px', color: '#1f2937', margin: '0 0 10px' }}>Phase-7</p>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 3px' }}>Bank Account</p>
            <p style={{ fontSize: '11.5px', color: '#1f2937', margin: '0', fontWeight: '600' }}>
              PK80ASCM0007350200027623
            </p>
          </div>

          <div style={{ width: '240px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px 6px 0 0',
                borderTop: '1px solid #e5e7eb',
                borderLeft: '1px solid #e5e7eb',
                borderRight: '1px solid #e5e7eb',
              }}
            >
              <span style={{ fontSize: '13px', color: '#374151' }}>Subtotal</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                {formatPKR(quote.subtotal)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '11px 12px',
                backgroundColor: '#14532d',
                borderRadius: '0 0 6px 6px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#d1fae5' }}>Total</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>
                {formatPKR(quote.total)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Divider before terms ── */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#e5e7eb',
            marginBottom: '20px',
          }}
        />

        {/* ── Terms ── */}
        <div style={{ marginBottom: '28px' }}>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#15803d',
              margin: '0 0 14px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Terms &amp; Conditions
          </p>
          {TERMS.map((term, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '10.5px',
                  color: '#16a34a',
                  fontWeight: 'bold',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                {i + 1}.
              </span>
              <p
                style={{
                  fontSize: '10.5px',
                  lineHeight: '1.65',
                  margin: '0',
                  color: '#374151',
                }}
              >
                {term}
              </p>
            </div>
          ))}
        </div>

        {/* ── Agreement box ── */}
        <div
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '12px 16px',
            backgroundColor: '#fafafa',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '10.5px', color: '#374151', margin: '0', lineHeight: '1.6' }}>
            By signing this document, the customer agrees to the services and conditions described
            above.
          </p>
        </div>

        {/* ── Signature box ── */}
        <div
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '22px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: '3px solid #16a34a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f0fdf4',
                margin: '0 auto 10px',
              }}
            >
              <span
                style={{
                  color: '#15803d',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  lineHeight: '1.4',
                  letterSpacing: '1px',
                }}
              >
                SUN
              </span>
              <span
                style={{
                  color: '#15803d',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  lineHeight: '1.4',
                  letterSpacing: '1px',
                }}
              >
                PULSE
              </span>
            </div>
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '4px' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#111827', margin: '0' }}>
                Authorized Signatory
              </p>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '2px 0 0' }}>Sun Pulse</p>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '160px', borderTop: '1px solid #9ca3af', paddingTop: '4px' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#111827', margin: '0' }}>
                Client Signatory
              </p>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '2px 0 0' }}>
                Date: ________________
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
