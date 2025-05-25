// client/src/pages/MentorMenteeUpdatesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import progressUpdateService from '../api/progressUpdateService.js';
// import userService from '../api/userService.js'; // To fetch mentee details if not passed

const MentorMenteeUpdatesPage = () => {
  const { menteeId } = useParams(); // Get menteeId from URL
  // const { user: mentorUser } = useAuth(); // Logged-in mentor

  const [updates, setUpdates] = useState([]);
  const [menteeName, setMenteeName] = useState(''); // To display mentee's name
  const [newUpdateText, setNewUpdateText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUpdatesAndMenteeInfo = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedUpdates = await progressUpdateService.getProgressUpdatesForMentee(menteeId);
      setUpdates(fetchedUpdates);
      // Assuming the first update (if any) has populated mentor details for the mentee
      // A more robust way would be a separate call to get mentee details if needed
      // or ensure getProgressUpdatesForMentee also returns mentee's name.
      // For now, if updates exist, use the first one's mentee name or fetch separately.
      // Let's assume for now that we don't have mentee name from this call directly.
      // We'd ideally fetch mentee's details separately or ensure `getProgressUpdatesForMentee` populates it.
      // For simplicity, let's skip displaying menteeName for now, or you can add another API call.
      // OR, if `getProgressUpdatesForMentee` populated the mentee on the update:
      if (fetchedUpdates.length > 0 && fetchedUpdates[0].mentee) {
         setMenteeName(`${fetchedUpdates[0].mentee.firstName} ${fetchedUpdates[0].mentee.lastName}`);
      } else {
        // Fallback or fetch mentee details separately if needed
        // const menteeData = await userService.getUserById(menteeId); // Hypothetical function
        // setMenteeName(`${menteeData.firstName} ${menteeData.lastName}`);
         setMenteeName(`Mentee (ID: ${menteeId.substring(0,8)}...)`); // Placeholder
      }

    } catch (err) {
      setError(err.message || 'Failed to fetch progress updates.');
    } finally {
      setLoading(false);
    }
  }, [menteeId]);

  useEffect(() => {
    if (menteeId) {
      fetchUpdatesAndMenteeInfo();
    }
  }, [menteeId, fetchUpdatesAndMenteeInfo]);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!newUpdateText.trim()) {
      setSubmitError('Update text cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await progressUpdateService.createProgressUpdate(menteeId, { updateText: newUpdateText });
      setNewUpdateText(''); // Clear textarea
      setSubmitSuccess('Progress update sent successfully!');
      fetchUpdatesAndMenteeInfo(); // Refresh updates list
    } catch (err) {
      setSubmitError(err.message || 'Failed to send update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading updates...</div>;
  if (error) return <div style={{ color: 'red' }}>Error loading data: {error}</div>;

  return (
    <div>
      <h3>Progress Updates for {menteeName || 'Mentee'}</h3>
      <Link to="/dashboard">← Back to Dashboard</Link>

      <section style={{ marginTop: '20px', marginBottom: '30px' }}>
        <h4>Existing Updates</h4>
        {updates.length === 0 ? (
          <p>No progress updates sent yet for this mentee.</p>
        ) : (
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            {updates.map(update => (
              <li key={update._id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                <p>{update.updateText}</p>
                <small>
                  By: {update.mentor?.firstName} {update.mentor?.lastName} on {new Date(update.createdAt).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr/>

      <section style={{ marginTop: '30px' }}>
        <h4>Send New Update to Guardian(s)</h4>
        {submitError && <p className="error-message">{submitError}</p>}
        {submitSuccess && <p className="success-message">{submitSuccess}</p>}
        <form onSubmit={handleUpdateSubmit}>
          <div>
            <label htmlFor="newUpdateText">Update Message:</label>
            <textarea
              id="newUpdateText"
              value={newUpdateText}
              onChange={(e) => setNewUpdateText(e.target.value)}
              rows="5"
              required
            />
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Update'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default MentorMenteeUpdatesPage;