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
    email: 'walescake@gmail.com',
    businessName: 'Wales Bakery',
    businessType: 'Bakery',
    phone: '+27 123 456 789',
    address: '897 Second St, Johannesburg',
    location: 'Johannesburg, South Africa',
    totalDonations: 3,
    lastDonation: '12 June 2026',
  }

  const donationHistory = [
  {
    date: '12 June 2026',
    ngo: 'Hope Foundation',
  },
  {
    date: '5 June 2026',
    ngo: 'Food For All NGO',
  },
  {
    date: '28 May 2026',
    ngo: 'Community Care Centre',
  },
]
  function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0]

    if (file) {
      setProfileImage(URL.createObjectURL(file))
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Donor Profile</h2>

            <div style={styles.businessRow}>
              <h3 style={styles.businessName}>
                {donor.businessName}
              </h3>

              <span style={styles.verified}>
                ✓ Verified
              </span>
            </div>

            <p style={styles.businessType}>
              {donor.businessType}
            </p>
          </div>

          <button
            style={styles.editBtn}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Save' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Image */}
        <div style={styles.profileSection}>
          <div style={styles.avatar}>
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                style={styles.avatarImg}
              />
            ) : (
              <span>Profile Image</span>
            )}
          </div>

          {editMode && (
            <label style={styles.uploadLabel}>
              Change Profile Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={styles.fileInput}
              />
            </label>
          )}
        </div>

        {/* Statistics */}
        <div style={styles.statsGrid}>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Total Donations
            </div>

            <div style={styles.statValue}>
              {donor.totalDonations}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Last Donation
            </div>

            <div style={styles.statValue}>
              {donor.lastDonation}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>
              Location
            </div>

            <button
              style={styles.mapButton}
              onClick={() => {
                // Map functionality can be connected here later
              }}
            >
              View Map
            </button>
          </div>

        </div>

        {/* Contact Information */}
        <div style={styles.infoGrid}>

          <Field
            label="Email"
            value={donor.email}
          />

          <Field
            label="Phone"
            value={donor.phone}
          />

          <Field
            label="Address"
            value={donor.address}
          />

          <Field
            label="Location"
            value={donor.location}
          />

        </div>

        {/* Donation History */}
        <section style={styles.historySection}>
          <h3 style={styles.historyTitle}>
            Donation History
          </h3>

          <div style={styles.historyList}>
            {donationHistory.map((donation, index) => (
              <div
                key={index}
                style={styles.historyItem}
              >
                <div style={styles.historyDate}>
                  {donation.date}
                </div>

                <div style={styles.historyItemName}>
               {donation.ngo}
            </div>
              </div>
            ))}
          </div>
        </section>

        {/* Back Button */}
        <div style={styles.bottomButtonContainer}>
          <button
            style={styles.backBtn}
            onClick={() =>
              navigate({ to: '/donor/dashboard' })
            }
          >
            ← Back to Donor Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={styles.field}>
      <div style={styles.label}>
        {label}
      </div>

      <div style={styles.value}>
        {value}
      </div>
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
    boxSizing: 'border-box',
  },

  card: {
    width: '100%',
    maxWidth: '1000px',
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    boxSizing: 'border-box',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '25px',
  },

  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 700,
    color: '#111827',
  },

  businessRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '28px',
  },

  businessName: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
  },

  verified: {
    color: '#16a34a',
    fontSize: '14px',
    fontWeight: 600,
  },

  businessType: {
    margin: '8px 0 0',
    color: '#6b7280',
    fontSize: '16px',
  },

  editBtn: {
    padding: '12px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#000000',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '69px',
  },

  profileSection: {
    marginBottom: '25px',
  },

  avatar: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    color: '#374151',
    overflow: 'hidden',
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  uploadLabel: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '8px 12px',
    background: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#111827',
  },

  fileInput: {
    display: 'none',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
    marginBottom: '25px',
  },

  statCard: {
    background: '#f8f9fb',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    minHeight: '70px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  statLabel: {
    fontSize: '17px',
    color: '#111827',
    marginBottom: '8px',
  },

  statValue: {
    fontSize: '18px',
    color: '#111827',
    fontWeight: 500,
  },

  mapButton: {
    border: 'none',
    background: 'transparent',
    color: '#111827',
    fontSize: '18px',
    cursor: 'pointer',
    padding: 0,
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '28px',
  },

  field: {
    background: '#f8f9fb',
    padding: '16px',
    borderRadius: '10px',
    minHeight: '48px',
  },

  label: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '6px',
  },

  value: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },

  historySection: {
    marginTop: '5px',
  },

  historyTitle: {
    fontSize: '20px',
    fontWeight: 500,
    color: '#111827',
    margin: '0 0 14px',
  },

  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  historyItem: {
    background: '#f3f4f6',
    padding: '16px',
    borderRadius: '10px',
  },

  historyDate: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
  },

  historyItemName: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#111827',
  },

  bottomButtonContainer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },

  backBtn: {
    padding: '11px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: 'white',
    color: '#111827',
    fontSize: '15px',
    cursor: 'pointer',
  },
}