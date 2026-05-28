import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { leaveApi } from '../services/api';

function MyLeaves() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadLeaves();
    }, []);

    const loadLeaves = async () => {
        try {
            const { data } = await leaveApi.myLeaves();
            setLeaves(data.leaves || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load leaves');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString();

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>My Leaves</h2>
                        <Link to="/leaves/apply" className="btn">+ Apply Leave</Link>
                    </div>

                    {error && <div className="error">{error}</div>}
                    {loading && <p>Loading...</p>}

                    {!loading && leaves.length === 0 && (
                        <p style={{ marginTop: 20, color: '#888' }}>No leave requests yet.</p>
                    )}

                    {leaves.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Days</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((leave) => (
                                    <tr key={leave._id}>
                                        <td>{leave.leaveType}</td>
                                        <td>{formatDate(leave.fromDate)}</td>
                                        <td>{formatDate(leave.toDate)}</td>
                                        <td>{leave.totalDays}</td>
                                        <td>{leave.reason}</td>
                                        <td>
                                            <span className={`status-badge status-${leave.status}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}

export default MyLeaves;
