import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/donor/profile')({
  component: DonorProfile,
})

function DonorProfile() {
  const navigate = useNavigate()

  const [editMode, setEditMode] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const donor = {
    businessName: 'Wales Bakery',
    businessType: 'Bakery',
    email: 'walescake@gmail.com',
    phone: '+27 123 456 789',
    address: '897 Second St, Johannesburg',
    location: 'Johannesburg, South Africa',
    verified: true,
  }

  const donations = [
    { date: '12 June 2026', item: 'Bread' },
    { date: '10 June 2026', item: 'Milk' },
    { date: '8 June 2026', item: 'Flour Bags' },
  ]

  const totalDonations = donations.length
  const lastDonation = donations[0].date

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setProfileImage(URL.createObjectURL(file))
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* TITLE */}
        <h1 style={styles.pageTitle}>Donor Profile</h1>

        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {donor.businessName}
            {donor.verified && <span style={styles.badge}>✔ Verified</span>}
          </h2>

          <button className="btn-edit">
            {editMode ? 'Save' : 'Edit Profile'}
          </button>
        </div>

        <p style={styles.subtitle}>{donor.businessType}</p>

        {/* PROFILE IMAGE */}
        <div style={styles.profileSection}>
          <div style={styles.avatar}>
            {profileImage ? (
              <img src={profileImage} style={styles.avatarImg} />
            ) : (
              'Profile Image'
            )}
          </div>

          {editMode && (
            <input type="file" onChange={handleImageUpload} />
          )}
        </div>

        {/* STATS */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <p>Total Donations</p>
            <h3>{totalDonations}</h3>
          </div>

          <div style={styles.statCard}>
            <p>Last Donation</p>
            <h3>{lastDonation}</h3>
          </div>
        </div>

        {/* INFO */}
        <div style={styles.grid}>
          <Field label="Email" value={donor.email} />
          <Field label="Phone" value={donor.phone} />
          <Field label="Address" value={donor.address} />
          <Field label="Location" value={donor.location} />
        </div>

        {/* HISTORY */}
        <h3 style={{ marginTop: 20 }}>Donation History</h3>

        <div style={styles.history}>
          {donations.map((d, i) => (
            <div key={i} style={styles.historyItem}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {d.date}
              </div>
              <div style={{ fontWeight: 600 }}>{d.item}</div>
            </div>
          ))}
        </div>

        {/* BACK BUTTON */}
        <div style={styles.backContainer}>
          <button
            className="btn-primary"
            onClick={() => navigate({ to: '/donor/dashboard' })}
          >
            Back to Dashboard
          </button>
        </div>

      </div>

      {/* BUTTON STYLES */}
      <style>{`
        .btn-primary {
          padding: 10px 16px;
          border-radius: 8px;
          border: none;
          background: #111827;
          color: white;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .btn-primary:hover {
          background: #374151;
        }

        .btn-edit {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          background: #000;
          color: white;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .btn-edit:hover {
          background: #333333;
        }
      `}</style>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.field}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '24px',
    display: 'flex',
    justifyContent: 'center',
    background: '#f3f4f6',
    minHeight: '100vh',
  },
  card: {
    width: '100%',
    maxWidth: '800px',
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#111827',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
  },
  badge: {
    marginLeft: 10,
    fontSize: '12px',
    color: 'green',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 20,
  },
  profileSection: {
    marginBottom: 20,
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    background: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginTop: 20,
  },
  field: {
    background: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  label: {
    fontSize: '12px',
    color: '#6b7280',
  },
  value: {
    fontSize: '14px',
    fontWeight: 500,
  },
  history: {
    marginTop: 10,
    display: 'grid',
    gap: 10,
  },
  historyItem: {
    background: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
  },
  backContainer: {
    marginTop: 30,
    display: 'flex',
    justifyContent: 'center',
  },
}