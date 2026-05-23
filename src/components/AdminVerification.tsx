import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 1. Define the TypeScript interface for your NGO data
interface NGO {
  id: string;
  name: string;
  npo_number: string;
  contact_email: string;
  status: string;
}

export default function AdminVerification() {
  // 2. Tell the state that it will hold an array of NGOs
  const [pendingNGOs, setPendingNGOs] = useState<NGO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchPendingNGOs();
  }, []);

  const fetchPendingNGOs = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('role', 'ngo')
        .eq('status', 'pending');

      if (error) throw error;
      setPendingNGOs(data || []);
    } catch (error: any) {
      console.error("Error fetching pending NGOs:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Define the types for the function parameters (strings)
  const handleReview = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setPendingNGOs((prevNGOs: NGO[]) => prevNGOs.filter((ngo: NGO) => ngo.id !== id));
      
      alert(`NGO successfully ${newStatus}!`);
    } catch (error: any) {
      console.error(`Error updating status to ${newStatus}:`, error.message);
      alert("Failed to update status. Check console.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading pending verifications...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">NGO Verification Queue</h2>
      
      {pendingNGOs.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No pending NGOs to review. You're all caught up!</p>
      ) : (
        <div className="space-y-4">
          {pendingNGOs.map((ngo: NGO) => (
            <div key={ngo.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
              
              <div>
                <h3 className="font-bold text-lg text-gray-900">{ngo.name}</h3>
                <p className="text-sm text-gray-600">NPO Number: <span className="font-mono">{ngo.npo_number || 'N/A'}</span></p>
                <p className="text-sm text-gray-600">Contact: {ngo.contact_email}</p>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => handleReview(ngo.id, 'verified')}
                  className="px-4 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600 transition"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReview(ngo.id, 'rejected')}
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition"
                >
                  Reject
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}