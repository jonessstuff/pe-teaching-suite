export default function PEHealthBadge() {
  return (
    <div className="inline-flex items-center gap-2.5">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#4F7FFA" />
        {/* EKG / heartbeat pulse line */}
        <path
          d="M2 16 L8 16 L10 8 L13 22 L16 10 L19 16 L30 16"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a2e', lineHeight: 1.25 }}>
          PE &amp; Health
        </p>
        <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.3, marginTop: 2 }}>
          PlansK12 module
        </p>
      </div>
    </div>
  )
}
