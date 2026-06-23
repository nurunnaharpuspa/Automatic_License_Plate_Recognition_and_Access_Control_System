export default function StatusBadge({ status }) {
  const map = {
    AUTO:         { label: 'Auto',         cls: 'text-green  border-green/30  bg-green/10'  },
    PENDING:      { label: 'Pending',      cls: 'text-amber  border-amber/30  bg-amber/10'  },
    CORRECTED:    { label: 'Corrected',    cls: 'text-teal   border-teal/30   bg-teal/10'   },
    UNREGISTERED: { label: 'Unregistered', cls: 'text-red    border-red/30    bg-red/10'    },
    ACTIVE:       { label: 'Active',       cls: 'text-green  border-green/30  bg-green/10'  },
    SUSPENDED:    { label: 'Suspended',    cls: 'text-red    border-red/30    bg-red/10'    },
    APPROVED:     { label: 'Approved',     cls: 'text-green  border-green/30  bg-green/10'  },
    REJECTED:     { label: 'Rejected',     cls: 'text-red    border-red/30    bg-red/10'    },
    ENTRY:        { label: 'Entry',        cls: 'text-teal   border-teal/30   bg-teal/10'   },
    EXIT:         { label: 'Exit',         cls: 'text-amber  border-amber/30  bg-amber/10'  },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'text-secondary border-border bg-surface' }
  return <span className={`status-badge ${cls}`}>{label}</span>
}