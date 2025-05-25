// client/src/pages/GuardianViewUpdatesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // For linking to specific mentee update views if needed
import { useAuth } from '../contexts/AuthContext.jsx';
import userService from '../api/userService.js'; // To get guardian's profile with linkedMentees
import progressUpdateService from '../api/progressUpdateService.js';

const GuardianViewUpdatesPage = () => {
  const { user: guardianUser } = useAuth();
  const [linkedMenteesWithUpdates, setLinkedMenteesWithUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGuardianData = useCallback(async () => {
    if (!guardianUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Fetch the guardian's full profile to get populated linkedMenteeIds
      const profileData = await userService.getMyProfile(); // Assumes this populates linkedMenteeIds

      if (profileData && profileData.linkedMenteeIds && profileData.linkedMenteeIds.length > 0) {
        const menteesData = await Promise.all(
          profileData.linkedMenteeIds.map(async (mentee) => {
            try {
              const updates = await progressUpdateService.getProgressUpdatesForMentee(mentee._id);
              return {
                ...mentee, // Contains mentee's _id, firstName, lastName, email
                updates: updates || [], // Ensure updates is an array
              };
            } catch (updateError) {
              console.error(`Failed to fetch updates for mentee ${mentee._id}`, updateError);
              return { ...mentee, updates: [], error: 'Could not load updates for this mentee.' };
            }
          })
        );
        setLinkedMenteesWithUpdates(menteesData);
      } else {
        setLinkedMenteesWithUpdates([]); // No linked mentees
      }
    } catch (err) {
      setError(err.message || 'Failed to load guardian data or mentee updates.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [guardianUser]);

  useEffect(() => {
    fetchGuardianData();
  }, [fetchGuardianData]);

  if (loading) return <div>Loading updates...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>Progress Updates for Your Mentee(s)</h2>
      {linkedMenteesWithUpdates.length === 0 ? (
        <p>No mentees are currently linked to your account, or no updates have been posted.</p>
      ) : (
        linkedMenteesWithUpdates.map(mentee => (
          <section key={mentee._id} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
            <h3>Updates for: {mentee.firstName} {mentee.lastName}</h3>
            {mentee.error && <p style={{color: 'orange'}}>{mentee.error}</p>}
            {mentee.updates && mentee.updates.length > 0 ? (
              <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                {mentee.updates.map(update => (
                  <li key={update._id} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                    <p>{update.updateText}</p>
                    <small>
                      From: {update.mentor?.firstName} {update.mentor?.lastName} on {new Date(update.createdAt).toLocaleString()}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              !mentee.error && <p>No updates posted yet for {mentee.firstName}.</p>
            )}
          </section>
        ))
      )}
    </div>
  );
};

export default GuardianViewUpdatesPage;