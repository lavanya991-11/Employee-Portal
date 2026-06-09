import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';

function Attendance() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Attendance" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Attendance</div>
                    </div>
                    <div className="erp-body">
                        <div className="erp-list-card" style={{ padding: 16 }}>
                            <p style={{ color: '#6b7280' }}>Attendance module — coming soon.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Attendance;
